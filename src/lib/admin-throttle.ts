import { createHmac } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { adminAuthThrottle } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

type AuthAction = "LOGIN" | "RECOVERY";

async function ensureThrottleTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_auth_throttle (
      key_hash varchar(64) PRIMARY KEY,
      action varchar(30) NOT NULL,
      window_started_at timestamp NOT NULL,
      failure_count integer NOT NULL DEFAULT 0,
      blocked_until timestamp,
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `));
}

function requestIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function throttleKey(req: NextRequest, action: AuthAction) {
  const secret =
    process.env.NORVANA_ADMIN_SESSION_SECRET ||
    process.env.NORVANA_ADMIN_RECOVERY_SECRET;

  if (!secret) {
    throw new Error("Admin throttle secret is not configured.");
  }

  return createHmac("sha256", secret)
    .update(`${action}|${requestIp(req)}`)
    .digest("hex");
}

export async function checkAdminThrottle(req: NextRequest, action: AuthAction) {
  await ensureThrottleTable();
  const keyHash = throttleKey(req, action);
  const [row] = await db
    .select()
    .from(adminAuthThrottle)
    .where(eq(adminAuthThrottle.keyHash, keyHash))
    .limit(1);

  if (!row) {
    return { allowed: true as const, keyHash };
  }

  const now = Date.now();
  if (row.blockedUntil && row.blockedUntil.getTime() > now) {
    return {
      allowed: false as const,
      keyHash,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((row.blockedUntil.getTime() - now) / 1000)
      ),
    };
  }

  if (now - row.windowStartedAt.getTime() >= WINDOW_MS) {
    await db.delete(adminAuthThrottle).where(eq(adminAuthThrottle.keyHash, keyHash));
  }

  return { allowed: true as const, keyHash };
}

export async function recordAdminAuthFailure(
  req: NextRequest,
  action: AuthAction
) {
  await ensureThrottleTable();
  const keyHash = throttleKey(req, action);
  const now = new Date();

  const [row] = await db
    .select()
    .from(adminAuthThrottle)
    .where(eq(adminAuthThrottle.keyHash, keyHash))
    .limit(1);

  if (!row || now.getTime() - row.windowStartedAt.getTime() >= WINDOW_MS) {
    await db
      .insert(adminAuthThrottle)
      .values({
        keyHash,
        action,
        windowStartedAt: now,
        failureCount: 1,
        blockedUntil: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: adminAuthThrottle.keyHash,
        set: {
          action,
          windowStartedAt: now,
          failureCount: 1,
          blockedUntil: null,
          updatedAt: now,
        },
      });

    return { blocked: false as const, failureCount: 1 };
  }

  const failureCount = row.failureCount + 1;
  const blockedUntil =
    failureCount >= MAX_FAILURES
      ? new Date(now.getTime() + BLOCK_MS)
      : row.blockedUntil;

  await db
    .update(adminAuthThrottle)
    .set({
      failureCount,
      blockedUntil,
      updatedAt: now,
    })
    .where(eq(adminAuthThrottle.keyHash, keyHash));

  return {
    blocked: Boolean(blockedUntil && blockedUntil.getTime() > now.getTime()),
    failureCount,
  };
}

export async function clearAdminAuthFailures(
  req: NextRequest,
  action: AuthAction
) {
  await ensureThrottleTable();
  const keyHash = throttleKey(req, action);
  await db.delete(adminAuthThrottle).where(eq(adminAuthThrottle.keyHash, keyHash));
}
