import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eraEvents, eras, eraSections } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { parseEraSectionDraft } from "@/lib/era-engine/admin-validation";

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

  let parsed;
  try {
    parsed = parseEraSectionDraft(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Era section." },
      { status: 400 }
    );
  }

  const [era] = await db.select({ id: eras.id }).from(eras).where(eq(eras.id, eraId)).limit(1);
  if (!era) return NextResponse.json({ error: "Era not found." }, { status: 404 });

  try {
    const [section] = await db
      .insert(eraSections)
      .values({ eraId, ...parsed, status: "ENABLED", updatedAt: new Date() })
      .returning();

    await db.insert(eraEvents).values({
      eraId,
      eventType: "SECTION_ADDED",
      actor: "owner",
      payload: { sectionId: section.id, sectionType: section.sectionType, position: section.position },
    });

    return NextResponse.json({ section, authority: "COMPOSE_ONLY_NO_ACTIVATION" }, { status: 201 });
  } catch (error) {
    console.error("Era section creation failed:", error);
    return NextResponse.json(
      { error: "Section could not be added. Its position may already be occupied." },
      { status: 409 }
    );
  }
}
