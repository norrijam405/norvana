import { createHmac } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { customerVoiceThrottle } from "@/db/schema";

type VoiceAction = "REVIEW_SUBMIT" | "REVIEW_REACT" | "MARKET_REQUEST";

const LIMITS: Record<VoiceAction, { windowMs: number; maxRequests: number }> = {
  REVIEW_SUBMIT: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  REVIEW_REACT: { windowMs: 60 * 60 * 1000, maxRequests: 120 },
  MARKET_REQUEST: { windowMs: 60 * 60 * 1000, maxRequests: 12 },
};

function requestIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function quotaKey(req: NextRequest, action: VoiceAction) {
  const secret = process.env.NORVANA_CUSTOMER_VOICE_RATE_SECRET;
  if (!secret) {
    throw new Error("NORVANA_CUSTOMER_VOICE_RATE_SECRET is not configured.");
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 256) || "unknown";
  return createHmac("sha256", secret)
    .update(action + "|" + requestIp(req) + "|" + userAgent)
    .digest("hex");
}

export async function consumeCustomerVoiceQuota(
  req: NextRequest,
  action: VoiceAction
) {
  const config = LIMITS[action];
  const keyHash = quotaKey(req, action);
  const now = new Date();

  const [row] = await db
    .select()
    .from(customerVoiceThrottle)
    .where(
      and(
        eq(customerVoiceThrottle.keyHash, keyHash),
        eq(customerVoiceThrottle.action, action)
      )
    )
    .limit(1);

  if (!row || now.getTime() - row.windowStartedAt.getTime() >= config.windowMs) {
    await db
      .insert(customerVoiceThrottle)
      .values({
        keyHash,
        action,
        windowStartedAt: now,
        requestCount: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          customerVoiceThrottle.keyHash,
          customerVoiceThrottle.action,
        ],
        set: {
          windowStartedAt: now,
          requestCount: 1,
          updatedAt: now,
        },
      });

    return {
      allowed: true as const,
      remaining: Math.max(0, config.maxRequests - 1),
    };
  }

  if (row.requestCount >= config.maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(
        (config.windowMs - (now.getTime() - row.windowStartedAt.getTime())) /
          1000
      )
    );
    return {
      allowed: false as const,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  const nextCount = row.requestCount + 1;
  await db
    .update(customerVoiceThrottle)
    .set({ requestCount: nextCount, updatedAt: now })
    .where(
      and(
        eq(customerVoiceThrottle.keyHash, keyHash),
        eq(customerVoiceThrottle.action, action)
      )
    );

  return {
    allowed: true as const,
    remaining: Math.max(0, config.maxRequests - nextCount),
  };
}
