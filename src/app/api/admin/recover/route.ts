import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setOwnerPassword } from "@/lib/admin-identity";
import { requireBrowserSameOrigin } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";
import {
  checkAdminThrottle,
  clearAdminAuthFailures,
  recordAdminAuthFailure,
} from "@/lib/admin-throttle";

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const originGate = requireBrowserSameOrigin(req);
  if (originGate) return originGate;

  if (process.env.NORVANA_ADMIN_RECOVERY_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Owner recovery is disabled.", code: "NORVANA_ADMIN_RECOVERY_DISABLED" },
      { status: 503 }
    );
  }

  const expected = process.env.NORVANA_ADMIN_RECOVERY_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Owner recovery is not configured.", code: "NORVANA_ADMIN_RECOVERY_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const throttle = await checkAdminThrottle(req, "RECOVERY");
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Too many recovery attempts. Try again later.", code: "NORVANA_ADMIN_RECOVERY_RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(throttle.retryAfterSeconds) },
      }
    );
  }

  const parsed = await readJsonObjectLimited(req, 16_384);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const recoverySecret =
    typeof parsed.body.recoverySecret === "string" ? parsed.body.recoverySecret : "";
  const newPassword =
    typeof parsed.body.newPassword === "string" ? parsed.body.newPassword : "";

  if (!recoverySecret || !secureEqual(recoverySecret, expected)) {
    const failure = await recordAdminAuthFailure(req, "RECOVERY");
    return NextResponse.json(
      {
        error: failure.blocked
          ? "Too many recovery attempts. Try again later."
          : "Invalid recovery credential.",
      },
      { status: failure.blocked ? 429 : 401 }
    );
  }

  try {
    const result = await setOwnerPassword(newPassword);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await clearAdminAuthFailures(req, "RECOVERY");

    return NextResponse.json({
      reset: true,
      instruction: "Disable NORVANA_ADMIN_RECOVERY_ENABLED after confirming login.",
    });
  } catch (error) {
    console.error("Admin recovery error:", error);
    return NextResponse.json(
      { error: "Unable to reset owner password." },
      { status: 500 }
    );
  }
}
