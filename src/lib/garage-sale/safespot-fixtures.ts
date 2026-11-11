/**
 * Digital Garage Sale consumes SafeSpot through this versioned, read-only adapter.
 * All fixtures are fictional. IgniAqua remains the data/policy owner.
 * Never reinterpret a survey/rating as official safety certification.
 */
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
export function getGarageSaleSafeSpotAdapter(): SafeSpotAdapterResponse {
  // Future adapter must be approved by IgniAqua and independently checked before changing this.
  return FICTIONAL_SAFESPOT_RESPONSE;
}
