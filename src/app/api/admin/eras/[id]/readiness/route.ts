import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdminRead } from "@/lib/admin-guard";
import { evaluateEraActivationReadiness } from "@/lib/era-engine/readiness";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdminRead(req);
  if (gate) return gate;

  const { id } = await params;
  const eraId = Number(id);
  if (!Number.isInteger(eraId) || eraId <= 0) {
    return NextResponse.json({ error: "Invalid Era id." }, { status: 400 });
  }

  const readiness = await evaluateEraActivationReadiness(eraId);
  if (!readiness) {
    return NextResponse.json({ error: "Era not found." }, { status: 404 });
  }

  return NextResponse.json({
    readiness,
    authority: "READINESS_ONLY_NO_ACTIVATION",
  });
}
