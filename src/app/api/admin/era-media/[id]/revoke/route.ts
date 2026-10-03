import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  eraEvents,
  eraMediaAssets,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

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
  const assetId = Number(id);
  if (!Number.isInteger(assetId) || assetId <= 0) {
    return NextResponse.json({ error: "Invalid media asset id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const revocationEvidenceRef = clean(body.revocationEvidenceRef, 1500);
  const reason = clean(body.reason, 1000);

  if (!revocationEvidenceRef) {
    return NextResponse.json(
      { error: "Revocation evidence reference is required." },
      { status: 409 }
    );
  }

  const [asset] = await db
    .select()
    .from(eraMediaAssets)
    .where(eq(eraMediaAssets.id, assetId))
    .limit(1);

  if (!asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  if (asset.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only APPROVED media can be revoked by this route." },
      { status: 409 }
    );
  }

  try {
    const revoked = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(eraMediaAssets)
        .set({
          rightsState: "REVOKED",
          status: "REVOKED",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(eraMediaAssets.id, assetId),
            eq(eraMediaAssets.status, "APPROVED"),
            eq(eraMediaAssets.updatedAt, asset.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("MEDIA_CHANGED_BEFORE_REVOCATION");

      await tx.insert(eraEvents).values({
        eraId: updated.eraId,
        eventType: "MEDIA_REVOKED",
        actor: "owner",
        payload: {
          assetId: updated.id,
          revocationEvidenceRef,
          reason,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_MEDIA_REVOKE",
        authorityClass: "ACT",
        subjectType: "era_media_asset",
        subjectId: String(updated.id),
        status: "PASS",
        actor: "owner",
        details: {
          eraId: updated.eraId,
          revocationEvidenceRef,
          reason,
        },
      });

      return updated;
    });

    return NextResponse.json({
      asset: revoked,
      authority: "ADMIN_ACT_RIGHTS_REVOCATION",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "MEDIA_REVOCATION_FAILED" },
      { status: 409 }
    );
  }
}
