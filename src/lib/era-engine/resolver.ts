import { and, asc, desc, eq } from "drizzle-orm";
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
import {
  isEraMediaPublic,
  isPublicEra,
  normalizeThemeTokens,
  PUBLIC_MEDIA_RIGHTS,
  validateEraSections,
} from "./policy";
import type { PublicEra } from "./types";

function publicProductImages(product: typeof products.$inferSelect) {
  return PUBLIC_MEDIA_RIGHTS.has(product.imageRightsState || "")
    ? product.images
    : [];
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function resolveArchivedPublicEra(
  era: typeof eras.$inferSelect,
  now: Date
): Promise<PublicEra | null> {
  const [row] = await db
    .select()
    .from(eraArchiveSnapshots)
    .where(eq(eraArchiveSnapshots.eraId, era.id))
    .orderBy(
      desc(eraArchiveSnapshots.createdAt),
      desc(eraArchiveSnapshots.id)
    )
    .limit(1);

  if (!row) return null;

  const snapshot = objectValue(row.snapshot);
  if (!snapshot || snapshot.schema !== "ACRE_ERA_ARCHIVE_SNAPSHOT_R0") return null;

  const eraSnapshot = objectValue(snapshot.era);
  if (!eraSnapshot) return null;

  const rawSections = arrayValue(snapshot.sections);
  const sectionRows = rawSections
    .map(objectValue)
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .filter((section) => stringValue(section.status) === "ENABLED")
    .map((section) => ({
      sectionType: stringValue(section.sectionType),
      position: numberValue(section.position),
      config: objectValue(section.config) ?? {},
    }))
    .sort((a, b) => a.position - b.position);

  const sectionDecision = validateEraSections(sectionRows);
  if (!sectionDecision.ok) return null;

  const media = arrayValue(snapshot.media)
    .map(objectValue)
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .filter((asset) =>
      isEraMediaPublic(
        {
          rightsState: stringValue(asset.rightsState),
          rightsEvidenceRef: stringValue(asset.rightsEvidenceRef) || null,
          mediaUrl: stringValue(asset.mediaUrl),
          rightsStartsAt: stringValue(asset.rightsStartsAt) || null,
          rightsEndsAt: stringValue(asset.rightsEndsAt) || null,
          status: stringValue(asset.status),
        },
        now
      )
    )
    .map((asset) => ({
      id: numberValue(asset.id),
      assetType: stringValue(asset.assetType),
      mediaUrl: stringValue(asset.mediaUrl),
      posterUrl: stringValue(asset.posterUrl) || null,
      altText: stringValue(asset.altText),
      brandName: stringValue(asset.brandName) || null,
      providerSlug: stringValue(asset.providerSlug) || null,
    }));

  const archivedProducts = arrayValue(snapshot.products)
    .map(objectValue)
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .map((entry) => ({
      membership: objectValue(entry.membership),
      product: objectValue(entry.product),
    }))
    .filter(
      (entry): entry is {
        membership: Record<string, unknown>;
        product: Record<string, unknown>;
      } => Boolean(entry.membership && entry.product)
    )
    .filter(
      ({ membership, product }) =>
        stringValue(membership.status) === "ACTIVE" &&
        stringValue(product.status) === "active"
    )
    .sort(
      (a, b) =>
        numberValue(a.membership.position) - numberValue(b.membership.position)
    )
    .map(({ membership, product }) => {
      // Archived third-party imagery is hidden by default because an old snapshot
      // cannot prove that a later affiliate/brand media license still permits display.
      const imageRightsState = stringValue(product.imageRightsState);
      const images =
        imageRightsState === "OWNED"
          ? arrayValue(product.images).filter(
              (value): value is string => typeof value === "string"
            )
          : [];

      return {
        id: numberValue(product.id),
        slug: stringValue(product.slug),
        name: stringValue(product.name),
        description: stringValue(product.description),
        price: numberValue(product.price),
        compareAtPrice: nullableNumber(product.compareAtPrice),
        niche: stringValue(product.niche),
        images,
        brandName: stringValue(product.brandName) || null,
        commerceModel: stringValue(product.commerceModel),
        sourceProviderSlug: stringValue(product.sourceProviderSlug) || null,
        authorizationState: stringValue(product.authorizationState),
        imageRightsState,
        externalSellerName: stringValue(product.externalSellerName) || null,
        role: stringValue(membership.role),
        position: numberValue(membership.position),
        curationReason: stringValue(membership.curationReason),
      };
    });

  const publicWatchtowerFacets = arrayValue(snapshot.watchtower)
    .map(objectValue)
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .map((binding) => stringValue(binding.publicFacet))
    .filter(Boolean);

  return {
    slug: stringValue(eraSnapshot.slug) || era.slug,
    name: stringValue(eraSnapshot.name) || era.name,
    eyebrow: stringValue(eraSnapshot.eyebrow),
    story: stringValue(eraSnapshot.story),
    kind: stringValue(eraSnapshot.kind) || era.kind,
    lifecycleState: era.lifecycleState,
    isPrimary: false,
    startAt: era.startAt?.toISOString() ?? stringValue(eraSnapshot.startAt) || null,
    endAt: era.endAt?.toISOString() ?? stringValue(eraSnapshot.endAt) || null,
    theme: normalizeThemeTokens(eraSnapshot.themeTokens),
    media,
    sections: sectionRows,
    products: archivedProducts,
    publicWatchtowerFacets,
  };
}

export async function resolvePublicEraBySlug(
  slug: string,
  now = new Date()
): Promise<PublicEra | null> {
  const [era] = await db
    .select()
    .from(eras)
    .where(eq(eras.slug, slug))
    .limit(1);

  if (!era || !isPublicEra(era, now)) return null;

  if (["CLOSED", "ARCHIVED"].includes(era.lifecycleState)) {
    return resolveArchivedPublicEra(era, now);
  }

  const [mediaRows, sectionRows, productRows, bindings] = await Promise.all([
    db
      .select()
      .from(eraMediaAssets)
      .where(eq(eraMediaAssets.eraId, era.id))
      .orderBy(asc(eraMediaAssets.id)),
    db
      .select()
      .from(eraSections)
      .where(and(eq(eraSections.eraId, era.id), eq(eraSections.status, "ENABLED")))
      .orderBy(asc(eraSections.position)),
    db
      .select({
        product: products,
        role: eraProducts.role,
        position: eraProducts.position,
        curationReason: eraProducts.curationReason,
      })
      .from(eraProducts)
      .innerJoin(products, eq(eraProducts.productId, products.id))
      .where(
        and(
          eq(eraProducts.eraId, era.id),
          eq(eraProducts.status, "ACTIVE"),
          eq(products.status, "active")
        )
      )
      .orderBy(asc(eraProducts.position)),
    db
      .select({
        publicFacet: eraWatchtowerBindings.publicFacet,
        importance: eraWatchtowerBindings.importance,
      })
      .from(eraWatchtowerBindings)
      .where(eq(eraWatchtowerBindings.eraId, era.id))
      .orderBy(asc(eraWatchtowerBindings.importance)),
  ]);

  const sectionDecision = validateEraSections(sectionRows);
  if (!sectionDecision.ok) {
    throw new Error(sectionDecision.code);
  }

  const media = mediaRows
    .filter((asset) => isEraMediaPublic(asset, now))
    .map((asset) => ({
      id: asset.id,
      assetType: asset.assetType,
      mediaUrl: asset.mediaUrl,
      posterUrl: asset.posterUrl,
      altText: asset.altText,
      brandName: asset.brandName,
      providerSlug: asset.providerSlug,
    }));

  return {
    slug: era.slug,
    name: era.name,
    eyebrow: era.eyebrow,
    story: era.story,
    kind: era.kind,
    lifecycleState: era.lifecycleState,
    isPrimary: era.isPrimary,
    startAt: era.startAt?.toISOString() ?? null,
    endAt: era.endAt?.toISOString() ?? null,
    theme: normalizeThemeTokens(era.themeTokens),
    media,
    sections: sectionRows.map((section) => ({
      sectionType: section.sectionType,
      position: section.position,
      config: section.config,
    })),
    products: productRows.map(({ product, role, position, curationReason }) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      niche: product.niche,
      images: publicProductImages(product),
      brandName: product.brandName,
      commerceModel: product.commerceModel,
      sourceProviderSlug: product.sourceProviderSlug,
      authorizationState: product.authorizationState,
      imageRightsState: product.imageRightsState,
      externalSellerName: product.externalSellerName,
      role,
      position,
      curationReason,
    })),
    publicWatchtowerFacets: bindings
      .map((binding) => binding.publicFacet)
      .filter((facet): facet is string => Boolean(facet)),
  };
}

export async function resolveCurrentPublicEra(now = new Date()) {
  const candidates = await db
    .select({ slug: eras.slug })
    .from(eras)
    .where(
      and(
        eq(eras.isPrimary, true),
        eq(eras.lifecycleState, "ACTIVE"),
        eq(eras.visibility, "PUBLIC")
      )
    )
    .limit(2);

  if (candidates.length === 0) {
    return { ok: false as const, code: "NO_ACTIVE_PRIMARY_ERA" };
  }

  if (candidates.length > 1) {
    return { ok: false as const, code: "AMBIGUOUS_ACTIVE_PRIMARY_ERA" };
  }

  const era = await resolvePublicEraBySlug(candidates[0].slug, now);
  if (!era) {
    return { ok: false as const, code: "ACTIVE_PRIMARY_ERA_NOT_PUBLIC_NOW" };
  }

  return { ok: true as const, era };
}
