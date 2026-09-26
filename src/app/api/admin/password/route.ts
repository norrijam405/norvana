import { NextRequest, NextResponse } from "next/server";
import { requireRecoveryAdmin } from "@/lib/admin-guard";
import { changeOwnerPassword } from "@/lib/admin-identity";

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  const body = await req.json().catch(() => ({}));
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  try {
    const result = await changeOwnerPassword(currentPassword, newPassword);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      changed: true,
      bootstrapCredentialNoLongerAuthoritative: true,
    });
  } catch (error) {
    console.error("Admin password change error:", error);
    return NextResponse.json(
      { error: "Unable to change owner password." },
      { status: 500 }
    );
  }
}
