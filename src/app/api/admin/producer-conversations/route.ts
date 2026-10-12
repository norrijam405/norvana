import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { producerConversationNotes } from "@/db/schema";
import {
  requireCurrentRecoveryAdmin,
  requireCurrentRecoveryAdminRead,
} from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";

const clean = (value: unknown, max = 2000) =>
  typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdminRead(req);
  if (gate) return gate;

  if (process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED !== "true") {
    return NextResponse.json({
      enabled: false,
      notes: [],
      message: "Server persistence is disabled. Browser draft mode remains available.",
    });
  }

  const rows = await db
    .select()
    .from(producerConversationNotes)
    .orderBy(desc(producerConversationNotes.createdAt))
    .limit(250);

  return NextResponse.json(
    { enabled: true, notes: rows },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  if (process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED !== "true") {
    return NextResponse.json(
      {
        error: "Watchtower conversation persistence is not enabled yet.",
        browserDraftAvailable: true,
      },
      { status: 503 }
    );
  }

  const parsed = await readJsonObjectLimited(req, 64_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const businessName = clean(parsed.body.businessName, 255);
  const contactName = clean(parsed.body.contactName, 255);
  const contactMethod = clean(parsed.body.contactMethod, 40) || "PHONE";
  const conversationStage = clean(parsed.body.conversationStage, 40) || "INTRO";
  const operatorSummary = clean(parsed.body.operatorSummary, 4000);
  const nextStep = clean(parsed.body.nextStep, 2000);
  const pilotRecommendation =
    clean(parsed.body.pilotRecommendation, 30) || "UNDECIDED";

  const answers =
    parsed.body.answers &&
    typeof parsed.body.answers === "object" &&
    !Array.isArray(parsed.body.answers)
      ? (parsed.body.answers as Record<string, unknown>)
      : {};

  if (businessName.length < 2) {
    return NextResponse.json(
      { error: "Farm / producer name is required." },
      { status: 400 }
    );
  }

  const producerId =
    Number.isInteger(Number(parsed.body.producerId))
      ? Number(parsed.body.producerId)
      : null;

  const interestSubmissionId =
    Number.isInteger(Number(parsed.body.interestSubmissionId))
      ? Number(parsed.body.interestSubmissionId)
      : null;

  const [created] = await db
    .insert(producerConversationNotes)
    .values({
      producerId,
      interestSubmissionId,
      businessName,
      contactName,
      contactMethod,
      conversationStage,
      answers,
      operatorSummary,
      nextStep,
      pilotRecommendation,
      evidenceRefs: [],
      actor: "owner",
    })
    .returning();

  return NextResponse.json(
    {
      saved: true,
      note: created,
      appendOnly: true,
      consequentialActionTaken: false,
    },
    { status: 201 }
  );
}
