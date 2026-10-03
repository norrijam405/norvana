import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
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
