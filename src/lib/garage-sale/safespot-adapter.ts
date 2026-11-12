/**
 * SafeSpot R0 -> Acre Era UI boundary. Pure, read-only, no fetch or credentials.
 * IgniAqua owns the source service. This module does not connect to it.
 * Any upstream VERIFIED is intentionally downgraded until source authenticity
 * and the deployment's authorization have independent evidence.
 */
import type { SafeSpotAdapterResponse, SafeSpotAttribute, SafeSpotOption } from "./safespot-fixtures";

type SourceAttribute = {
  status?: unknown; value?: unknown; sourceUrl?: unknown; checkedAt?: unknown; needsReview?: unknown;
};
type SourcePlace = {
  id?: unknown; label?: unknown; location?: unknown; attributes?: unknown; safetyGuarantee?: unknown;
};
const asObject = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const hasHttps = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try { const url = new URL(value); return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password; }
  catch { return false; }
};
const validTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const asAttribute = (value: SourceAttribute | unknown): SafeSpotAttribute => {
  const input = asObject(value);
  const checkedAt = validTimestamp(input.checkedAt) ? input.checkedAt : null;
  const sourceUrl = hasHttps(input.sourceUrl) ? input.sourceUrl : null;
  // Do not mistake a structurally plausible URL/timestamp for authentic evidence.
  // Reported is the highest display state until an independently approved real integration.
  const upstreamStatus = input.status;
  const state = upstreamStatus === "REPORTED" || upstreamStatus === "VERIFIED" ? "REPORTED" : "UNKNOWN";
  return { state, checkedAt, sourceUrl };
};
const unknown = (): SafeSpotAttribute => ({ state: "UNKNOWN", sourceUrl: null, checkedAt: null });
export function normalizeSafeSpotForAcreEra(source: unknown): SafeSpotAdapterResponse {
  const raw = asObject(source);
  const places = Array.isArray(raw.places) ? raw.places : [];
  const seen = new Set<string>();
  const options: SafeSpotOption[] = [];
  for (const candidate of places.slice(0, 30)) {
    const place = asObject(candidate as SourcePlace);
    if (typeof place.id !== "string" || !/^[a-z0-9_-]{3,64}$/.test(place.id) || seen.has(place.id)) continue;
    seen.add(place.id);
    const attributes = asObject(place.attributes);
    const name = typeof place.label === "string" ? place.label.trim().slice(0, 120) : "";
    options.push({
      id: place.id,
      displayName: name || "Unnamed location",
      regionLabel: "Location not independently verified",
      addressVisibility: "REDACTED",
      attributes: {
        designatedExchangeZone: attributes.officialExchangeZone ? asAttribute(attributes.officialExchangeZone) : unknown(),
        lighting: attributes.lighting ? asAttribute(attributes.lighting) : unknown(),
        accessHours: attributes.operatingHours ? asAttribute(attributes.operatingHours) : unknown(),
      },
      accessHoursLabel: null,
      officialSourceUrl: null,
    });
  }
  return { schemaVersion: "safespot-venue-r0", provider: "FICTIONAL_FIXTURE", integration: "FIXTURE_ONLY", options };
}
