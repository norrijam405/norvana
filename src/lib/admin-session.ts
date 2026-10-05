import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { ownerSessionVersion } from "@/lib/admin-identity";

export const ADMIN_SESSION_COOKIE = "norvana_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const REMEMBERED_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AdminSessionPayload = {
  role: "owner";
  iat: number;
  exp: number;
  sv?: number;
};

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function adminSessionConfigured() {
  return Boolean(process.env.NORVANA_ADMIN_SESSION_SECRET);
}

export function createAdminSessionToken(
  sessionVersion = 0,
  now = Date.now(),
  ttlSeconds = SESSION_TTL_SECONDS
) {
  const secret = required("NORVANA_ADMIN_SESSION_SECRET");
  const iat = Math.floor(now / 1000);
  const payload: AdminSessionPayload = {
    role: "owner",
    iat,
    exp: iat + Math.min(Math.max(ttlSeconds, SESSION_TTL_SECONDS), REMEMBERED_SESSION_TTL_SECONDS),
    sv: sessionVersion,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token || !process.env.NORVANA_ADMIN_SESSION_SECRET) return null;

  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return null;

  const expectedSignature = createHmac("sha256", process.env.NORVANA_ADMIN_SESSION_SECRET)
    .update(encoded)
    .digest("base64url");

  if (!safeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.role !== "owner" || payload.exp <= now || payload.iat > now + 60) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function verifyCurrentAdminSessionToken(token?: string | null) {
  const payload = verifyAdminSessionToken(token);
  if (!payload || !payload.sv || payload.sv < 1) return null;

  const currentVersion = await ownerSessionVersion();
  if (!currentVersion || payload.sv !== currentVersion) return null;

  return payload;
}

export function adminSessionFromRequest(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function currentAdminSessionFromRequest(req: NextRequest) {
  return verifyCurrentAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
export const ADMIN_REMEMBERED_SESSION_MAX_AGE = REMEMBERED_SESSION_TTL_SECONDS;
