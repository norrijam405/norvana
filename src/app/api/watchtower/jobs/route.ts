import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs } from "@/db/schema";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

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

  const body = await req.json().catch(() => ({}));
  const authority = String(body.authority || "OBSERVE").toUpperCase();

  if (!SAFE_AUTHORITIES.has(authority)) {
    return NextResponse.json(
      { error: "R0 jobs may only use OBSERVE or RECOMMEND authority." },
      { status: 400 }
    );
  }

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const cadenceMinutes = Math.max(60, Number(body.cadenceMinutes) || 1440);

  try {
    const [job] = await db
      .insert(watchJobs)
      .values({
        name,
        slug,
        category: String(body.category || "general"),
        description: String(body.description || ""),
        instructions: String(body.instructions || ""),
        authority,
        status: "PAUSED",
        cadenceMinutes,
        budgetCents: Math.max(0, Number(body.budgetCents) || 0),
        sourcePolicy:
          body.sourcePolicy && typeof body.sourcePolicy === "object" ? body.sourcePolicy : {},
      })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Watchtower job create error:", error);
    return NextResponse.json({ error: "Unable to create Watchtower job." }, { status: 500 });
  }
}
