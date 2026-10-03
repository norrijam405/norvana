import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchtowerSignals } from "@/db/schema";
import {
  requireCurrentRecoveryAdmin,
  requireCurrentRecoveryAdminRead,
} from "@/lib/admin-guard";
import { signalIsFresh } from "@/lib/watchtower/signal-policy";
import { ingestWatchtowerSignal } from "@/lib/watchtower/signal-bus";

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdminRead(req);
  if (gate) return gate;

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") || 50);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 50;

  const rows = await db
    .select({
      id: watchtowerSignals.id,
      signalKey: watchtowerSignals.signalKey,
      signalType: watchtowerSignals.signalType,
      subjectType: watchtowerSignals.subjectType,
      subjectKey: watchtowerSignals.subjectKey,
      truthState: watchtowerSignals.truthState,
      sourceKind: watchtowerSignals.sourceKind,
      evidenceRef: watchtowerSignals.evidenceRef,
      observedAt: watchtowerSignals.observedAt,
      expiresAt: watchtowerSignals.expiresAt,
      publicPayload: watchtowerSignals.publicPayload,
      payloadDigest: watchtowerSignals.payloadDigest,
      createdAt: watchtowerSignals.createdAt,
    })
    .from(watchtowerSignals)
    .orderBy(desc(watchtowerSignals.observedAt), desc(watchtowerSignals.id))
    .limit(limit);

  return NextResponse.json(
    {
      signals: rows.map((row) => ({
        ...row,
        fresh: signalIsFresh(row),
      })),
      privatePayloadIncluded: false,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

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
