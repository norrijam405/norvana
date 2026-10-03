import { createHash } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  eraArchiveSnapshots,
  eraMediaAssets,
  eraProducts,
  eras,
  eraSections,
  eraWatchtowerBindings,
  products,
} from "@/db/schema";

function stable(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stable(nested)])
    );
  }
  return value;
}

export function canonicalSnapshotJson(value: unknown) {
  return JSON.stringify(stable(value));
}

export function snapshotDigest(value: unknown) {
  return createHash("sha256").update(canonicalSnapshotJson(value)).digest("hex");
}

export async function buildEraArchiveSnapshot(eraId: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId)).limit(1);
  if (!era) return null;

  const [sections, media, memberships, watchtowerBindings] = await Promise.all([
    db
      .select()
      .from(eraSections)
      .where(eq(eraSections.eraId, eraId))
      .orderBy(asc(eraSections.position), asc(eraSections.id)),
    db
      .select()
      .from(eraMediaAssets)
      .where(eq(eraMediaAssets.eraId, eraId))
      .orderBy(asc(eraMediaAssets.id)),
    db
      .select({
        membership: eraProducts,
        product: {
          id: products.id,
          slug: products.slug,
          name: products.name,
          description: products.description,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          niche: products.niche,
          commerceModel: products.commerceModel,
          sourceProviderSlug: products.sourceProviderSlug,
          brandName: products.brandName,
          productCondition: products.productCondition,
          authorizationState: products.authorizationState,
          imageRightsState: products.imageRightsState,
          externalSellerName: products.externalSellerName,
          externalProductId: products.externalProductId,
          images: products.images,
          status: products.status,
        },
      })
      .from(eraProducts)
      .innerJoin(products, eq(eraProducts.productId, products.id))
      .where(eq(eraProducts.eraId, eraId))
      .orderBy(asc(eraProducts.position), asc(eraProducts.id)),
    db
      .select()
      .from(eraWatchtowerBindings)
      .where(eq(eraWatchtowerBindings.eraId, eraId))
      .orderBy(asc(eraWatchtowerBindings.importance), asc(eraWatchtowerBindings.id)),
  ]);

  const snapshot = {
    schema: "ACRE_ERA_ARCHIVE_SNAPSHOT_R0",
    era: {
      id: era.id,
      slug: era.slug,
      name: era.name,
      eyebrow: era.eyebrow,
      story: era.story,
      kind: era.kind,
      lifecycleState: era.lifecycleState,
      visibility: era.visibility,
      isPrimary: era.isPrimary,
      startAt: era.startAt?.toISOString() ?? null,
      endAt: era.endAt?.toISOString() ?? null,
      themeTokens: era.themeTokens,
      archivePolicy: era.archivePolicy,
      createdAt: era.createdAt.toISOString(),
      updatedAt: era.updatedAt.toISOString(),
    },
    sections: sections.map((section) => ({
      id: section.id,
      sectionType: section.sectionType,
      position: section.position,
      config: section.config,
      status: section.status,
    })),
    media: media.map((asset) => ({
      id: asset.id,
      assetType: asset.assetType,
      mediaUrl: asset.mediaUrl,
      posterUrl: asset.posterUrl,
      rightsState: asset.rightsState,
      rightsEvidenceRef: asset.rightsEvidenceRef,
      sourceLabel: asset.sourceLabel,
      sourceUrl: asset.sourceUrl,
      brandName: asset.brandName,
      providerSlug: asset.providerSlug,
      rightsStartsAt: asset.rightsStartsAt?.toISOString() ?? null,
      rightsEndsAt: asset.rightsEndsAt?.toISOString() ?? null,
      status: asset.status,
      sha256: asset.sha256,
      altText: asset.altText,
    })),
    products: memberships.map(({ membership, product }) => ({
      membership: {
        id: membership.id,
        position: membership.position,
        role: membership.role,
        curationReason: membership.curationReason,
        evidenceRef: membership.evidenceRef,
        status: membership.status,
        assignedAt: membership.assignedAt.toISOString(),
        removedAt: membership.removedAt?.toISOString() ?? null,
      },
      product,
    })),
    watchtower: watchtowerBindings.map((binding) => ({
      watchJobSlug: binding.watchJobSlug,
      importance: binding.importance,
      publicFacet: binding.publicFacet,
      config: binding.config,
    })),
  };

  return {
    snapshot,
    digest: snapshotDigest(snapshot),
    eraUpdatedAt: era.updatedAt.toISOString(),
  };
}

export async function persistEraArchiveSnapshot(input: {
  eraId: number;
  snapshotKind: string;
  evidenceRef: string;
  actor: string;
}) {
  const built = await buildEraArchiveSnapshot(input.eraId);
  if (!built) return null;

  const [saved] = await db
    .insert(eraArchiveSnapshots)
    .values({
      eraId: input.eraId,
      snapshotKind: input.snapshotKind,
      snapshotDigest: built.digest,
      snapshot: built.snapshot,
      evidenceRef: input.evidenceRef,
      actor: input.actor,
    })
    .onConflictDoNothing({ target: eraArchiveSnapshots.snapshotDigest })
    .returning();

  if (saved) return saved;

  const [existing] = await db
    .select()
    .from(eraArchiveSnapshots)
    .where(eq(eraArchiveSnapshots.snapshotDigest, built.digest))
    .limit(1);

  return existing ?? null;
}
