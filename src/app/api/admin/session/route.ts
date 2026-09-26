import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminAuthConfigured,
  adminSessionFromRequest,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-session";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: adminAuthConfigured(),
    authenticated: Boolean(adminSessionFromRequest(req)),
  });
}

export async function POST(req: NextRequest) {
  if (!adminAuthConfigured()) {
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

  if (!password || !verifyAdminPassword(password)) {
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
