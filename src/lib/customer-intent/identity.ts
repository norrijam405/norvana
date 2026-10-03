import { createHmac, randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const INTENT_ACTOR_COOKIE = "acre_era_intent_actor";

function secret() {
  const value = process.env.NORVANA_CUSTOMER_INTENT_SECRET;
  if (!value) throw new Error("NORVANA_CUSTOMER_INTENT_SECRET is not configured.");
  return value;
}

export function hashIntentActor(raw: string) {
  return createHmac("sha256", secret()).update(raw).digest("hex");
}

export function readIntentActorHash(req: NextRequest) {
  const raw = req.cookies.get(INTENT_ACTOR_COOKIE)?.value?.trim();
  if (!raw) return null;
  return hashIntentActor(raw);
}

export function ensureIntentActor(req: NextRequest) {
  const existing = req.cookies.get(INTENT_ACTOR_COOKIE)?.value?.trim();
  const raw = existing || randomUUID();
  return {
    actorKeyHash: hashIntentActor(raw),
    newCookieValue: existing ? null : raw,
  };
}

export function attachIntentActorCookie(
  response: NextResponse,
  newCookieValue: string | null
) {
  if (!newCookieValue) return response;

  response.cookies.set(INTENT_ACTOR_COOKIE, newCookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
