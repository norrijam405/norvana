export const ERA_KINDS = [
  "CATEGORY",
  "BRAND",
  "SEASONAL",
  "PARTNER",
  "MARKET",
  "LOCAL",
  "EDITORIAL",
  "CAMPAIGN",
] as const;

export const ERA_LIFECYCLE_STATES = [
  "DRAFT",
  "QUALIFYING",
  "SCHEDULED",
  "ACTIVE",
  "CLOSED",
  "ARCHIVED",
  "SUSPENDED",
] as const;

export const ERA_VISIBILITY = ["PRIVATE", "UNLISTED", "PUBLIC"] as const;

export const ERA_SECTION_TYPES = [
  "HERO",
  "WHY_THIS_ERA",
  "PRODUCT_GRID",
  "PARTNER_FINDS",
  "MARKET_TEASER",
  "CUSTOMER_VOICE",
  "BRING_IT_HERE",
  "WATCHTOWER_SUMMARY",
  "COMPARISON",
  "BUNDLE",
  "EDITORIAL",
  "ARCHIVE_TEASER",
  "ALERT_CTA",
] as const;

export const ERA_PRODUCT_ROLES = [
  "HERO",
  "FEATURED",
  "STANDARD",
  "BUNDLE",
  "WATCH",
] as const;

export const ERA_MEDIA_TYPES = [
  "HERO_VIDEO",
  "HERO_IMAGE",
  "POSTER",
  "CARD_IMAGE",
  "EDITORIAL_VIDEO",
] as const;

export const ERA_MEDIA_RIGHTS_STATES = [
  "OWNED",
  "LICENSED_STOCK",
  "BRAND_AUTHORIZED",
  "AFFILIATE_FEED_AUTHORIZED",
  "SUPPLIER_AUTHORIZED",
  "PENDING_VERIFICATION",
  "RESTRICTED",
  "EXPIRED",
  "REVOKED",
] as const;

export const PUBLIC_MEDIA_RIGHTS = new Set<string>([
  "OWNED",
  "LICENSED_STOCK",
  "BRAND_AUTHORIZED",
  "AFFILIATE_FEED_AUTHORIZED",
  "SUPPLIER_AUTHORIZED",
]);

export const APPROVED_THEME_TOKENS = {
  earth: {
    accent: "leaf",
    accentSoft: "sage-wash",
    surface: "cream",
    surfaceAlt: "wheat",
    text: "soil",
    textMuted: "muted",
    heroOverlay: "soil",
    motionProfile: "organic",
  },
  ember: {
    accent: "ember",
    accentSoft: "wheat",
    surface: "cream",
    surfaceAlt: "sage-wash",
    text: "soil",
    textMuted: "muted",
    heroOverlay: "soil",
    motionProfile: "kinetic",
  },
  nocturne: {
    accent: "wheat",
    accentSoft: "soil",
    surface: "soil",
    surfaceAlt: "cream",
    text: "cream",
    textMuted: "muted",
    heroOverlay: "soil",
    motionProfile: "cinematic",
  },
  cleanTech: {
    accent: "leaf",
    accentSoft: "cream",
    surface: "cream",
    surfaceAlt: "sage-wash",
    text: "soil",
    textMuted: "muted",
    heroOverlay: "soil",
    motionProfile: "precision",
  },
} as const;

function isRelativePublicAsset(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

export function isSafePublicMediaUrl(value: string | null | undefined) {
  if (!value) return false;
  if (isRelativePublicAsset(value)) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEraMediaPublic(input: {
  rightsState: string;
  rightsEvidenceRef?: string | null;
  mediaUrl: string;
  rightsStartsAt?: Date | string | null;
  rightsEndsAt?: Date | string | null;
  status: string;
}, now = new Date()) {
  if (input.status !== "APPROVED") return false;
  if (!PUBLIC_MEDIA_RIGHTS.has(input.rightsState)) return false;
  if (!input.rightsEvidenceRef?.trim()) return false;
  if (!isSafePublicMediaUrl(input.mediaUrl)) return false;

  const starts = input.rightsStartsAt ? new Date(input.rightsStartsAt) : null;
  const ends = input.rightsEndsAt ? new Date(input.rightsEndsAt) : null;
  if (starts && Number.isFinite(starts.getTime()) && now < starts) return false;
  if (ends && Number.isFinite(ends.getTime()) && now >= ends) return false;

  return true;
}

export function normalizeThemeTokens(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return APPROVED_THEME_TOKENS.earth;
  }

  const requested = String((value as Record<string, unknown>).preset || "");
  if (requested && requested in APPROVED_THEME_TOKENS) {
    return APPROVED_THEME_TOKENS[requested as keyof typeof APPROVED_THEME_TOKENS];
  }

  return APPROVED_THEME_TOKENS.earth;
}

export function validateEraSections(
  sections: Array<{ sectionType: string; position: number; status?: string | null }>
) {
  const allowed = new Set<string>(ERA_SECTION_TYPES);
  const seen = new Set<number>();

  for (const section of sections) {
    if (!allowed.has(section.sectionType)) {
      return { ok: false as const, code: "ERA_SECTION_TYPE_NOT_ALLOWED" };
    }
    if (!Number.isInteger(section.position) || section.position < 0) {
      return { ok: false as const, code: "ERA_SECTION_POSITION_INVALID" };
    }
    if (seen.has(section.position)) {
      return { ok: false as const, code: "ERA_SECTION_POSITION_DUPLICATE" };
    }
    seen.add(section.position);
  }

  return { ok: true as const };
}

export function isPublicEra(input: {
  lifecycleState: string;
  visibility: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
}, now = new Date()) {
  if (input.visibility !== "PUBLIC") return false;
  if (!["ACTIVE", "CLOSED", "ARCHIVED"].includes(input.lifecycleState)) return false;

  const starts = input.startAt ? new Date(input.startAt) : null;
  const ends = input.endAt ? new Date(input.endAt) : null;

  if (input.lifecycleState === "ACTIVE") {
    if (starts && Number.isFinite(starts.getTime()) && now < starts) return false;
    if (ends && Number.isFinite(ends.getTime()) && now >= ends) return false;
  }

  return true;
}
