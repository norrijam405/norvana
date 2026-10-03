import { providerBySlug } from "./provider-registry.ts";

export const DISPLAYABLE_IMAGE_RIGHTS = [
  "OWNED",
  "BRAND_AUTHORIZED",
  "SUPPLIER_AUTHORIZED",
  "AFFILIATE_FEED_AUTHORIZED",
] as const;

export type DisplayableImageRights = (typeof DISPLAYABLE_IMAGE_RIGHTS)[number];

export function canDisplayExternalProductImage(rightsState: string | null | undefined) {
  return DISPLAYABLE_IMAGE_RIGHTS.includes(rightsState as DisplayableImageRights);
}

function hostMatches(hostname: string, allowed: string) {
  return hostname === allowed || hostname.endsWith("." + allowed);
}

export function evaluateAffiliateDestination(input: {
  providerSlug: string | null | undefined;
  destinationUrl: string | null | undefined;
}) {
  const provider = input.providerSlug ? providerBySlug(input.providerSlug) : null;
  if (!provider || !provider.models.includes("AFFILIATE_REFERRAL")) {
    return {
      ok: false as const,
      code: "AFFILIATE_PROVIDER_NOT_APPROVED",
      reason: "The product is not bound to an approved affiliate provider definition.",
    };
  }

  const allowedHosts = provider.checkoutHosts ?? [];
  if (!allowedHosts.length) {
    return {
      ok: false as const,
      code: "AFFILIATE_PROVIDER_HOSTS_MISSING",
      reason: "The affiliate provider has no allowed checkout hosts.",
    };
  }

  let url: URL;
  try {
    url = new URL(input.destinationUrl || "");
  } catch {
    return {
      ok: false as const,
      code: "AFFILIATE_DESTINATION_INVALID",
      reason: "The affiliate destination is not a valid URL.",
    };
  }

  if (url.protocol !== "https:") {
    return {
      ok: false as const,
      code: "AFFILIATE_DESTINATION_REQUIRES_HTTPS",
      reason: "Affiliate checkout links must use HTTPS.",
    };
  }

  const hostname = url.hostname.toLowerCase();
  if (!allowedHosts.some((host) => hostMatches(hostname, host.toLowerCase()))) {
    return {
      ok: false as const,
      code: "AFFILIATE_DESTINATION_HOST_NOT_ALLOWED",
      reason: "The affiliate destination host does not match the approved provider.",
    };
  }

  return {
    ok: true as const,
    url,
    provider,
  };
}

export function affiliateDisclosure(partnerName: string) {
  return `Acre Era may earn a commission if you buy through this link. Checkout, payment, shipping, returns, and warranty are handled by ${partnerName} under its terms.`;
}
