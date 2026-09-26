import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminSessionConfigured,
  adminSessionFromRequest,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { ownerLoginConfigured, verifyOwnerPassword } from "@/lib/admin-identity";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: adminSessionConfigured() && (await ownerLoginConfigured()),
    authenticated: Boolean(adminSessionFromRequest(req)),
  });
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

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

export async function DELETE() {
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
