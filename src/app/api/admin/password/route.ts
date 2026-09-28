import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { changeOwnerPassword } from "@/lib/admin-identity";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { readJsonObjectLimited } from "@/lib/request-body";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const parsed = await readJsonObjectLimited(req, 16_384);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const currentPassword =
    typeof parsed.body.currentPassword === "string" ? parsed.body.currentPassword : "";
  const newPassword =
    typeof parsed.body.newPassword === "string" ? parsed.body.newPassword : "";

  try {
    const result = await changeOwnerPassword(currentPassword, newPassword);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      changed: true,
      bootstrapCredentialNoLongerAuthoritative: true,
      reloginRequired: true,
    });

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
  } catch (error) {
    console.error("Admin password change error:", error);
    return NextResponse.json(
      { error: "Unable to change owner password." },
      { status: 500 }
    );
  }
}
