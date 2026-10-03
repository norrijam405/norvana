import {
  ERA_MEDIA_RIGHTS_STATES,
  ERA_MEDIA_TYPES,
  ERA_PRODUCT_ROLES,
  ERA_SECTION_TYPES,
  isSafePublicMediaUrl,
} from "./policy";

export const ERA_PUBLIC_WATCHTOWER_FACETS = [
  "PRICE",
  "STOCK",
  "WARRANTY",
  "AUTHORIZATION",
  "AUTHENTICITY",
  "PROVENANCE",
  "RECALL_SAFETY",
  "CUSTOMER_VOICE",
  "DEMAND",
  "SHIPPING",
  "RETURNS",
] as const;

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function objectConfig(value: unknown, maxSerialized = 20_000) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (serialized.length > maxSerialized) throw new Error("ERA_CONFIG_TOO_LARGE");

  const lowered = serialized.toLowerCase();
  for (const forbidden of [
    "dangerouslysetinnerhtml",
    "<script",
    "javascript:",
    '"html"',
    '"css"',
  ]) {
    if (lowered.includes(forbidden)) throw new Error("ERA_CONFIG_UNSAFE_CONTENT");
  }

  return value as Record<string, unknown>;
}

export function parseEraMediaDraft(value: Record<string, unknown>) {
  const assetType = clean(value.assetType, 50);
  const mediaUrl = clean(value.mediaUrl, 1500);
  const posterUrl = clean(value.posterUrl, 1500) || null;
  const rightsState = clean(value.rightsState || "PENDING_VERIFICATION", 60);
  const rightsEvidenceRef = clean(value.rightsEvidenceRef, 1500) || null;

  if (!ERA_MEDIA_TYPES.includes(assetType as (typeof ERA_MEDIA_TYPES)[number])) {
    throw new Error("ERA_MEDIA_TYPE_NOT_ALLOWED");
  }
  if (
    !ERA_MEDIA_RIGHTS_STATES.includes(
      rightsState as (typeof ERA_MEDIA_RIGHTS_STATES)[number]
    )
  ) {
    throw new Error("ERA_MEDIA_RIGHTS_STATE_NOT_ALLOWED");
  }
  if (!isSafePublicMediaUrl(mediaUrl)) throw new Error("ERA_MEDIA_URL_INVALID");
  if (posterUrl && !isSafePublicMediaUrl(posterUrl)) {
    throw new Error("ERA_MEDIA_POSTER_URL_INVALID");
  }

  return {
    assetType,
    mediaUrl,
    posterUrl,
    rightsState,
    rightsEvidenceRef,
    sourceLabel: clean(value.sourceLabel, 255) || null,
    sourceUrl: clean(value.sourceUrl, 1500) || null,
    brandName: clean(value.brandName, 255) || null,
    providerSlug: clean(value.providerSlug, 120) || null,
    sha256: clean(value.sha256, 64) || null,
    altText: clean(value.altText, 500),
  };
}

export function parseEraSectionDraft(value: Record<string, unknown>) {
  const sectionType = clean(value.sectionType, 60);
  const position = Number(value.position);

  if (
    !ERA_SECTION_TYPES.includes(
      sectionType as (typeof ERA_SECTION_TYPES)[number]
    )
  ) {
    throw new Error("ERA_SECTION_TYPE_NOT_ALLOWED");
  }
  if (!Number.isInteger(position) || position < 0 || position > 100) {
    throw new Error("ERA_SECTION_POSITION_INVALID");
  }

  return {
    sectionType,
    position,
    config: objectConfig(value.config),
  };
}

export function parseEraProductAssignment(value: Record<string, unknown>) {
  const productId = Number(value.productId);
  const position = Number(value.position ?? 0);
  const role = clean(value.role || "STANDARD", 30);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("ERA_PRODUCT_ID_INVALID");
  }
  if (!Number.isInteger(position) || position < 0 || position > 10_000) {
    throw new Error("ERA_PRODUCT_POSITION_INVALID");
  }
  if (!ERA_PRODUCT_ROLES.includes(role as (typeof ERA_PRODUCT_ROLES)[number])) {
    throw new Error("ERA_PRODUCT_ROLE_NOT_ALLOWED");
  }

  return {
    productId,
    position,
    role,
    curationReason: clean(value.curationReason, 5000),
    evidenceRef: clean(value.evidenceRef, 1500) || null,
  };
}

export function parseEraWatchtowerBinding(value: Record<string, unknown>) {
  const watchJobSlug = clean(value.watchJobSlug, 160);
  const importance = Number(value.importance ?? 50);
  const publicFacet = clean(value.publicFacet, 80) || null;

  if (!watchJobSlug) throw new Error("ERA_WATCH_JOB_REQUIRED");
  if (!Number.isInteger(importance) || importance < 0 || importance > 100) {
    throw new Error("ERA_WATCH_IMPORTANCE_INVALID");
  }
  if (
    publicFacet &&
    !ERA_PUBLIC_WATCHTOWER_FACETS.includes(
      publicFacet as (typeof ERA_PUBLIC_WATCHTOWER_FACETS)[number]
    )
  ) {
    throw new Error("ERA_WATCH_PUBLIC_FACET_NOT_ALLOWED");
  }

  return {
    watchJobSlug,
    importance,
    publicFacet,
    config: objectConfig(value.config),
  };
}
