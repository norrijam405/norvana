import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setOwnerPassword } from "@/lib/admin-identity";

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const recoverySecret =
    typeof body.recoverySecret === "string" ? body.recoverySecret : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!recoverySecret || !secureEqual(recoverySecret, expected)) {
    return NextResponse.json({ error: "Invalid recovery credential." }, { status: 401 });
  }

  try {
    const result = await setOwnerPassword(newPassword);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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
