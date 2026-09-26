import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminSessionConfigured,
  adminSessionFromRequest,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { requireBrowserSameOrigin } from "@/lib/admin-guard";
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
  verifyOwnerPassword,
} from "@/lib/admin-identity";

export async function GET(req: NextRequest) {
  const databaseOwnerPresent = await ownerIdentityExists();
  const ownerCredential = await ownerCredentialState();
  const bootstrapConfigured = bootstrapAdminConfigured();

  return NextResponse.json({
    configured: adminSessionConfigured() && (databaseOwnerPresent || bootstrapConfigured),
    authenticated: Boolean(adminSessionFromRequest(req)),
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

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

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

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
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
