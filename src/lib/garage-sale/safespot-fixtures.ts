/**
 * Digital Garage Sale consumes SafeSpot through this versioned, read-only adapter.
 * All fixtures are fictional. IgniAqua remains the data/policy owner.
 * Never reinterpret a survey/rating as official safety certification.
 */
import { consumeIgniAquaSafeSpotR11 } from "./safespot-r11-contract.ts";
export type EvidenceState = "UNKNOWN" | "REPORTED" | "VERIFIED";
export type SafeSpotAttribute = {
  state: EvidenceState;
  sourceUrl: string | null;
  checkedAt: string | null;
};
export type SafeSpotOption = {
  id: string;
  displayName: string;
  regionLabel: string;
  addressVisibility: "REDACTED" | "PUBLIC_OFFICIAL";
  attributes: {
    designatedExchangeZone: SafeSpotAttribute;
    lighting: SafeSpotAttribute;
    accessHours: SafeSpotAttribute;
  };
  accessHoursLabel: string | null;
  officialSourceUrl: string | null;
  // No private user locations, incidents, or personal identifiers in this contract.
};
export type SafeSpotAdapterResponse = {
  schemaVersion: "safespot-venue-r0";
  provider: "IGNIAQUA_SAFESPOT" | "FICTIONAL_FIXTURE";
  integration: "FIXTURE_ONLY" | "CONNECTED_UNVERIFIED" | "VERIFIED";
  options: SafeSpotOption[];
};
const unknown = (): SafeSpotAttribute => ({ state: "UNKNOWN", sourceUrl: null, checkedAt: null });
export const FICTIONAL_SAFESPOT_RESPONSE: SafeSpotAdapterResponse = {
  schemaVersion: "safespot-venue-r0",
  provider: "FICTIONAL_FIXTURE",
  integration: "FIXTURE_ONLY",
  options: [
    {
      id: "fictional-civic-plaza",
      displayName: "Civic Plaza Exchange Point",
      regionLabel: "Sample neighborhood",
      addressVisibility: "REDACTED",
      attributes: { designatedExchangeZone: unknown(), lighting: unknown(), accessHours: unknown() },
      accessHoursLabel: null,
      officialSourceUrl: null,
    },
    {
      id: "fictional-community-center",
      displayName: "Community Center Meet Point",
      regionLabel: "Sample neighborhood",
      addressVisibility: "REDACTED",
      attributes: { designatedExchangeZone: unknown(), lighting: unknown(), accessHours: unknown() },
      accessHoursLabel: null,
      officialSourceUrl: null,
    },
  ],
};
/**
 * Explicitly synthetic R1.1 producer-shaped fixture. This function does NOT
 * import or execute IgniAqua's producer or make a network request.
 */
export function getGarageSaleSafeSpotR11Demo(now = new Date()) {
  const claim = { status: "UNKNOWN", value: null, sourceUrl: null, checkedAt: null, needsReview: false };
  return consumeIgniAquaSafeSpotR11({
    schemaVersion: "igniaqua-safespot-public-venues-r1",
    provider: "IGNIAQUA_SAFESPOT",
    integration: "OFFLINE_DRAFT",
    client: "ACRE_ERA",
    generatedAt: now.toISOString(),
    places: FICTIONAL_SAFESPOT_RESPONSE.options.map(option => ({
      id: option.id,
      label: option.displayName,
      attributes: {
        officialExchangeZone: claim, lighting: claim, cameras: claim,
        publicAccess: claim, operatingHours: claim,
      },
    })),
  }, now);
}

export function getGarageSaleSafeSpotAdapter(): SafeSpotAdapterResponse {
  // Existing UI consumes only the sanitized output from R1.1 contract review.
  return getGarageSaleSafeSpotR11Demo().display;
}
