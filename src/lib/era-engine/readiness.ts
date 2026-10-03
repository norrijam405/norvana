import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  eraMediaAssets,
  eraProducts,
  eras,
  eraSections,
  products,
} from "@/db/schema";
import {
  isEraMediaPublic,
  validateEraSections,
} from "./policy";
import { snapshotDigest } from "./archive-canonical";

export type EraReadiness = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  counts: {
    sections: number;
    publicMedia: number;
    products: number;
  };
  eraUpdatedAt: string;
  readinessDigest: string;
};

export async function evaluateEraActivationReadiness(
  eraId: number,
  now = new Date()
): Promise<EraReadiness | null> {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId)).limit(1);
  if (!era) return null;

  const [sections, media, assignments] = await Promise.all([
    db.select().from(eraSections).where(
      and(eq(eraSections.eraId, eraId), eq(eraSections.status, "ENABLED"))
    ),
    db.select().from(eraMediaAssets).where(eq(eraMediaAssets.eraId, eraId)),
    db
      .select({
        assignmentId: eraProducts.id,
        productId: products.id,
        productStatus: products.status,
        commerceModel: products.commerceModel,
        authorizationState: products.authorizationState,
        externalCheckoutUrl: products.externalCheckoutUrl,
      })
      .from(eraProducts)
      .innerJoin(products, eq(eraProducts.productId, products.id))
      .where(and(eq(eraProducts.eraId, eraId), eq(eraProducts.status, "ACTIVE"))),
  ]);

  const blockers: string[] = [];
  const warnings: string[] = [];

  const sectionDecision = validateEraSections(sections);
  if (!sectionDecision.ok) blockers.push(sectionDecision.code);

  if (!sections.some((section) => section.sectionType === "HERO")) {
    blockers.push("ERA_HERO_SECTION_MISSING");
  }

  const publicMedia = media.filter((asset) => isEraMediaPublic(asset, now));
  const publicHeroMedia = publicMedia.filter((asset) =>
    ["HERO_VIDEO", "HERO_IMAGE"].includes(asset.assetType)
  );

  if (publicHeroMedia.length === 0) {
    blockers.push("ERA_PUBLIC_HERO_MEDIA_MISSING");
  }

  const liveAssignments = assignments.filter(
    (assignment) => assignment.productStatus === "active"
  );

  if (era.kind !== "EDITORIAL" && liveAssignments.length === 0) {
    blockers.push("ERA_ACTIVE_PRODUCT_MISSING");
  }

  for (const assignment of liveAssignments) {
    if (
      assignment.commerceModel === "AFFILIATE_REFERRAL" &&
      assignment.authorizationState !== "AFFILIATE_PROGRAM_APPROVED"
    ) {
      blockers.push(
        `ERA_AFFILIATE_AUTHORIZATION_MISSING:${assignment.productId}`
      );
    }
    if (
      assignment.commerceModel === "AFFILIATE_REFERRAL" &&
      !assignment.externalCheckoutUrl
    ) {
      blockers.push(
        `ERA_AFFILIATE_DESTINATION_MISSING:${assignment.productId}`
      );
    }
  }

  if (era.startAt && now < era.startAt) {
    blockers.push("ERA_START_TIME_IN_FUTURE");
  }
  if (era.endAt && now >= era.endAt) {
    blockers.push("ERA_END_TIME_ELAPSED");
  }

  if (!era.story.trim()) warnings.push("ERA_STORY_EMPTY");
  if (!era.eyebrow.trim()) warnings.push("ERA_EYEBROW_EMPTY");
  if (!era.startAt) warnings.push("ERA_START_TIME_UNSET");
  if (!era.endAt) warnings.push("ERA_END_TIME_UNSET");

  const readinessDigest = snapshotDigest({
    era: {
      id: era.id,
      kind: era.kind,
      lifecycleState: era.lifecycleState,
      visibility: era.visibility,
      isPrimary: era.isPrimary,
      startAt: era.startAt?.toISOString() ?? null,
      endAt: era.endAt?.toISOString() ?? null,
      updatedAt: era.updatedAt.toISOString(),
    },
    sections: [...sections]
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((section) => ({
        id: section.id,
        sectionType: section.sectionType,
        position: section.position,
        status: section.status,
        config: section.config,
      })),
    media: [...media]
      .sort((a, b) => a.id - b.id)
      .map((asset) => ({
        id: asset.id,
        assetType: asset.assetType,
        status: asset.status,
        rightsState: asset.rightsState,
        rightsEvidenceRef: asset.rightsEvidenceRef,
        mediaUrl: asset.mediaUrl,
        posterUrl: asset.posterUrl,
        rightsStartsAt: asset.rightsStartsAt?.toISOString() ?? null,
        rightsEndsAt: asset.rightsEndsAt?.toISOString() ?? null,
        altText: asset.altText,
      })),
    products: [...assignments]
      .sort((a, b) => a.assignmentId - b.assignmentId)
      .map((assignment) => ({
        assignmentId: assignment.assignmentId,
        productId: assignment.productId,
        productStatus: assignment.productStatus,
        commerceModel: assignment.commerceModel,
        authorizationState: assignment.authorizationState,
        externalCheckoutUrl: assignment.externalCheckoutUrl,
      })),
  });

  return {
    ready: blockers.length === 0,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    counts: {
      sections: sections.length,
      publicMedia: publicMedia.length,
      products: liveAssignments.length,
    },
    eraUpdatedAt: era.updatedAt.toISOString(),
    readinessDigest,
  };
}
