import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  eraEvents,
  eras,
  eraWatchtowerBindings,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { parseEraWatchtowerBinding } from "@/lib/era-engine/admin-validation";
import {
  WATCHTOWER_ALL_JOB_TEMPLATES,
} from "@/lib/watchtower/default-jobs";

const KNOWN_WATCH_JOBS = new Set(WATCHTOWER_ALL_JOB_TEMPLATES.map((job) => job.slug));

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
    parsed = parseEraWatchtowerBinding(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Watchtower binding." },
      { status: 400 }
    );
  }

  if (!KNOWN_WATCH_JOBS.has(parsed.watchJobSlug)) {
    return NextResponse.json({ error: "Unknown Watchtower job." }, { status: 400 });
  }

  const [era] = await db.select({ id: eras.id }).from(eras).where(eq(eras.id, eraId)).limit(1);
  if (!era) return NextResponse.json({ error: "Era not found." }, { status: 404 });

  try {
    const [binding] = await db
      .insert(eraWatchtowerBindings)
      .values({ eraId, ...parsed })
      .returning();

    await db.insert(eraEvents).values({
      eraId,
      eventType: "WATCHTOWER_BOUND",
      actor: "owner",
      payload: {
        bindingId: binding.id,
        watchJobSlug: binding.watchJobSlug,
        publicFacet: binding.publicFacet,
      },
    });

    return NextResponse.json(
      {
        binding,
        authority: "READ_RECOMMEND_BINDING_ONLY",
        note: "Binding an Era never enables or grants ACT authority to a Watchtower job.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Era Watchtower binding failed:", error);
    return NextResponse.json({ error: "Watchtower job is already bound to this Era." }, { status: 409 });
  }
}
