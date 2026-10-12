import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  ADMIN_REMEMBERED_SESSION_MAX_AGE,
  adminSessionConfigured,
  currentAdminSessionFromRequest,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { requireBrowserSameOrigin } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";
import {
  checkAdminThrottle,
  clearAdminAuthFailures,
  recordAdminAuthFailure,
} from "@/lib/admin-throttle";
import {
  bootstrapAdminConfigured,
  ownerCredentialState,
  ownerIdentityExists,
  ownerLoginConfigured,
  ownerSessionVersion,
  verifyOwnerPassword,
} from "@/lib/admin-identity";

export async function GET(req: NextRequest) {
  const databaseOwnerPresent = await ownerIdentityExists();
  const ownerCredential = await ownerCredentialState();
  const bootstrapConfigured = bootstrapAdminConfigured();

  return NextResponse.json({
    configured: adminSessionConfigured() && (databaseOwnerPresent || bootstrapConfigured),
    authenticated: Boolean(await currentAdminSessionFromRequest(req)),
    credentialSource: databaseOwnerPresent ? "database-owner" : bootstrapConfigured ? "bootstrap" : "none",
    databaseOwnerPresent,
    ownerCredentialRotated: ownerCredential.rotated,
    ownerCredentialBootstrapDerived: ownerCredential.bootstrapDerived,
    bootstrapConfigured,
  });
}

export async function POST(req: NextRequest) {
  const originGate = requireBrowserSameOrigin(req);
  if (originGate) return originGate;

  if (!adminSessionConfigured()) {
    return NextResponse.json(
      {
        error: "Owner session security is not configured yet.",
        code: "NORVANA_ADMIN_SESSION_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  if (!(await ownerLoginConfigured())) {
    return NextResponse.json(
      {
        error: "Owner login is not configured yet.",
        code: "NORVANA_ADMIN_LOGIN_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const throttle = await checkAdminThrottle(req, "LOGIN");
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Too many owner login attempts. Try again later.", code: "NORVANA_ADMIN_RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(throttle.retryAfterSeconds) },
      }
    );
  }

  const parsed = await readJsonObjectLimited(req, 8_192);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const password =
    typeof parsed.body.password === "string" ? parsed.body.password : "";
  const rememberDevice = parsed.body.rememberDevice === true;

  let valid = false;
  try {
    valid = await verifyOwnerPassword(password);
  } catch (error) {
    console.error("Admin identity verification error:", error);
    return NextResponse.json(
      { error: "Owner identity service is unavailable." },
      { status: 503 }
    );
  }

  if (!valid) {
    const failure = await recordAdminAuthFailure(req, "LOGIN");
    return NextResponse.json(
      {
        error: failure.blocked
          ? "Too many owner login attempts. Try again later."
          : "Invalid credentials.",
      },
      { status: failure.blocked ? 429 : 401 }
    );
  }

  await clearAdminAuthFailures(req, "LOGIN");

  const sessionVersion = await ownerSessionVersion();
  if (!sessionVersion) {
    return NextResponse.json(
      { error: "Owner session version is unavailable." },
      { status: 503 }
    );
  }

  const maxAge = rememberDevice
    ? ADMIN_REMEMBERED_SESSION_MAX_AGE
    : ADMIN_SESSION_MAX_AGE;
  const response = NextResponse.json({
    authenticated: true,
    remembered: rememberDevice,
    maxAgeSeconds: maxAge,
  });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(sessionVersion, Date.now(), maxAge),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return response;
}

export async function DELETE(req: NextRequest) {
  const originGate = requireBrowserSameOrigin(req);
  if (originGate) return originGate;

  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
