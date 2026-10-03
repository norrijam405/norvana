import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { eraEvents, eras } from "@/db/schema";
import {
  APPROVED_THEME_TOKENS,
  ERA_KINDS,
} from "@/lib/era-engine/policy";
import {
  requireCurrentRecoveryAdmin,
  requireCurrentRecoveryAdminRead,
} from "@/lib/admin-guard";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function normalizeSlug(value: unknown) {
  return clean(value, 180)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdminRead(req);
  if (gate) return gate;

  const rows = await db.select().from(eras).orderBy(asc(eras.name));
  return NextResponse.json({ eras: rows }, { headers: { "cache-control": "no-store" } });
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

  const name = clean(body.name, 255);
  const slug = normalizeSlug(body.slug || name);
  const eyebrow = clean(body.eyebrow, 160);
  const story = clean(body.story, 10_000);
  const kind = clean(body.kind || "CATEGORY", 40);
  const themePreset = clean(body.themePreset || "earth", 40);

  if (!name || !slug) {
    return NextResponse.json({ error: "Era name and slug are required." }, { status: 400 });
  }

  if (!ERA_KINDS.includes(kind as (typeof ERA_KINDS)[number])) {
    return NextResponse.json({ error: "Unsupported Era kind." }, { status: 400 });
  }

  if (!(themePreset in APPROVED_THEME_TOKENS)) {
    return NextResponse.json({ error: "Unsupported theme preset." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(eras)
      .values({
        slug,
        name,
        eyebrow,
        story,
        kind,
        lifecycleState: "DRAFT",
        visibility: "PRIVATE",
        isPrimary: false,
        themeTokens: { preset: themePreset },
        watchtowerProfile: {},
        archivePolicy: { preserveOnClose: true },
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(eraEvents).values({
      eraId: created.id,
      eventType: "ERA_CREATED",
      actor: "owner",
      payload: {
        lifecycleState: "DRAFT",
        visibility: "PRIVATE",
        isPrimary: false,
      },
    });

    return NextResponse.json(
      {
        era: created,
        authority: "DRAFT_ONLY",
        nextGate: "ERA_QUALIFICATION_AND_ACTIVATION",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Era draft creation failed:", error);
    return NextResponse.json(
      { error: "Era could not be created. The slug may already exist." },
      { status: 409 }
    );
  }
}
