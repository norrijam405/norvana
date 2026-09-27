import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs } from "@/db/schema";
import { requireRecoveryAdmin } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";

const SAFE_AUTHORITIES = new Set(["OBSERVE", "RECOMMEND"]);

export async function GET(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const jobs = await db.select().from(watchJobs).orderBy(asc(watchJobs.name));
    return NextResponse.json(jobs);
  } catch {
    return NextResponse.json(
      { error: "Watchtower is not initialized.", code: "WATCHTOWER_NOT_INITIALIZED" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  const parsed = await readJsonObjectLimited(req, 32_768);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const body = parsed.body;
  const authority = String(body.authority || "OBSERVE").toUpperCase();

  if (!SAFE_AUTHORITIES.has(authority)) {
    return NextResponse.json(
      { error: "R0 jobs may only use OBSERVE or RECOMMEND authority." },
      { status: 400 }
    );
  }

  const name = String(body.name || "").trim().slice(0, 255);
  const slug = String(body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const rawCadence = body.cadenceMinutes === undefined ? 1440 : Number(body.cadenceMinutes);
  if (!Number.isFinite(rawCadence) || !Number.isInteger(rawCadence)) {
    return NextResponse.json(
      { error: "cadenceMinutes must be an integer.", code: "WATCHTOWER_INVALID_CADENCE" },
      { status: 400 }
    );
  }
  const cadenceMinutes = Math.min(525_600, Math.max(60, rawCadence));

  const rawBudget = body.budgetCents === undefined ? 0 : Number(body.budgetCents);
  if (!Number.isFinite(rawBudget) || !Number.isInteger(rawBudget) || rawBudget < 0) {
    return NextResponse.json(
      { error: "budgetCents must be a non-negative integer.", code: "WATCHTOWER_INVALID_BUDGET" },
      { status: 400 }
    );
  }
  const requestedBudgetCents = rawBudget;

  const sourcePolicy =
    body.sourcePolicy &&
    typeof body.sourcePolicy === "object" &&
    !Array.isArray(body.sourcePolicy)
      ? (body.sourcePolicy as Record<string, unknown>)
      : {};

  if (requestedBudgetCents !== 0) {
    return NextResponse.json(
      {
        error: "R0 watchers must start with a $0 automation budget.",
        code: "WATCHTOWER_NONZERO_BUDGET_LOCKED",
      },
      { status: 400 }
    );
  }

  try {
    const [job] = await db
      .insert(watchJobs)
      .values({
        name,
        slug,
        category: String(body.category || "general").slice(0, 80),
        description: String(body.description || "").slice(0, 10_000),
        instructions: String(body.instructions || "").slice(0, 20_000),
        authority,
        status: "PAUSED",
        cadenceMinutes,
        budgetCents: 0,
        sourcePolicy,
      })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Watchtower job create error:", error);
    return NextResponse.json({ error: "Unable to create Watchtower job." }, { status: 500 });
  }
}
