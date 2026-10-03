import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ingestWatchtowerSignal } from "@/lib/watchtower/signal-bus";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await ingestWatchtowerSignal({
      signalKey: body.signalKey,
      signalType: body.signalType,
      subjectType: body.subjectType,
      subjectKey: body.subjectKey,
      truthState: body.truthState,
      sourceKind: body.sourceKind,
      evidenceRef: body.evidenceRef,
      observedAt: body.observedAt,
      expiresAt: body.expiresAt,
      publicPayload: body.publicPayload,
      privatePayload: body.privatePayload,
    });

    return NextResponse.json(
      {
        ...result,
        authority: "OBSERVE_PROJECT_QUEUE_ONLY",
      },
      { status: result.inserted ? 201 : 200 }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "WATCHTOWER_SIGNAL_INGEST_FAILED";
    const status = code === "WATCHTOWER_SIGNAL_KEY_COLLISION" ? 409 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
