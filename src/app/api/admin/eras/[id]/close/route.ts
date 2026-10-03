import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  closeEra,
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
    const result = await closeEra({
      eraId,
      closureEvidenceRef: clean(body.closureEvidenceRef, 1500),
      publicNote: clean(body.publicNote, 2000),
      actor: "owner",
    });
    return NextResponse.json({
      era: result.era,
      archiveSnapshot: {
        id: result.snapshot.id,
        digest: result.snapshot.snapshotDigest,
        createdAt: result.snapshot.createdAt,
      },
      authority: result.authority,
    });
  } catch (error) {
    if (error instanceof EraLifecycleError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "ERA_CLOSE_FAILED" }, { status: 409 });
  }
}
