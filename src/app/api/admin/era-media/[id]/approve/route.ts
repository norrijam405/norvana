import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  eraEvents,
  eraMediaAssets,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { evaluateMediaApprovalReadiness } from "@/lib/governance/activation";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function optionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_DATE");
  return date;
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

  const approvalEvidenceRef = clean(body.approvalEvidenceRef, 1500);
  if (!approvalEvidenceRef) {
    return NextResponse.json(
      { error: "Approval evidence reference is required." },
      { status: 409 }
    );
  }

  const [asset] = await db
    .select()
    .from(eraMediaAssets)
    .where(eq(eraMediaAssets.id, assetId))
    .limit(1);

  if (!asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  if (asset.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT media can be approved." },
      { status: 409 }
    );
  }

  let rightsStartsAt: Date | null;
  let rightsEndsAt: Date | null;
  try {
    rightsStartsAt =
      body.rightsStartsAt !== undefined
        ? optionalDate(body.rightsStartsAt)
        : asset.rightsStartsAt;
    rightsEndsAt =
      body.rightsEndsAt !== undefined
        ? optionalDate(body.rightsEndsAt)
        : asset.rightsEndsAt;
  } catch {
    return NextResponse.json({ error: "Rights window is invalid." }, { status: 400 });
  }

  if (rightsStartsAt && rightsEndsAt && rightsStartsAt >= rightsEndsAt) {
    return NextResponse.json({ error: "Rights end must be after rights start." }, { status: 400 });
  }

  const rightsState = clean(body.rightsState || asset.rightsState, 60);
  const rightsEvidenceRef =
    clean(body.rightsEvidenceRef || asset.rightsEvidenceRef, 1500) || null;
  const altText =
    body.altText !== undefined ? clean(body.altText, 500) : asset.altText;

  const readiness = evaluateMediaApprovalReadiness({
    assetType: asset.assetType,
    mediaUrl: asset.mediaUrl,
    posterUrl: asset.posterUrl,
    rightsState,
    rightsEvidenceRef,
    rightsStartsAt,
    rightsEndsAt,
    altText,
  });

  if (!readiness.ready) {
    return NextResponse.json(
      { error: "Media is not ready for approval.", blockers: readiness.blockers },
      { status: 409 }
    );
  }

  try {
    const approved = await db.transaction(async (tx) => {
      const now = new Date();
      const [updated] = await tx
        .update(eraMediaAssets)
        .set({
          rightsState,
          rightsEvidenceRef,
          rightsStartsAt,
          rightsEndsAt,
          altText,
          status: "APPROVED",
          updatedAt: now,
        })
        .where(
          and(
            eq(eraMediaAssets.id, assetId),
            eq(eraMediaAssets.status, "DRAFT"),
            eq(eraMediaAssets.updatedAt, asset.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("MEDIA_CHANGED_BEFORE_APPROVAL");

      await tx.insert(eraEvents).values({
        eraId: updated.eraId,
        eventType: "MEDIA_APPROVED",
        actor: "owner",
        payload: {
          assetId: updated.id,
          assetType: updated.assetType,
          rightsState: updated.rightsState,
          approvalEvidenceRef,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_MEDIA_APPROVE",
        authorityClass: "ACT",
        subjectType: "era_media_asset",
        subjectId: String(updated.id),
        status: "PASS",
        actor: "owner",
        details: {
          eraId: updated.eraId,
          rightsState: updated.rightsState,
          approvalEvidenceRef,
        },
      });

      return updated;
    });

    return NextResponse.json({
      asset: approved,
      authority: "ADMIN_ACT_WITH_EVIDENCE",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "MEDIA_APPROVAL_FAILED" },
      { status: 409 }
    );
  }
}
