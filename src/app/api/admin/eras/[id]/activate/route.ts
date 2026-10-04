import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  activateEra,
  EraLifecycleError,
} from "@/lib/era-engine/lifecycle-service";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const eraId = Number(id);
  if (!Number.isInteger(eraId) || eraId <= 0) {
    return NextResponse.json({ error: "Invalid Era id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await activateEra({
      eraId,
      activationEvidenceRef: clean(body.activationEvidenceRef, 1500),
      expectedReadinessDigest: clean(body.expectedReadinessDigest, 64),
      makePrimary: body.makePrimary === true,
      actor: "owner",
    });
    return NextResponse.json({
      era: result.era,
      authority: result.authority,
    });
  } catch (error) {
    if (error instanceof EraLifecycleError) {
      const payload: Record<string, unknown> = { error: error.code };
      if (error.details) Object.assign(payload, error.details);
      return NextResponse.json(payload, { status: error.status });
    }
    console.error("Era activation failed:", error);
    return NextResponse.json({ error: "ERA_ACTIVATION_FAILED" }, { status: 409 });
  }
}
