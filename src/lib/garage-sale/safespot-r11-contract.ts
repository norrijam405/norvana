/**
 * Acre Era consumer for the EXACT offline SafeSpot R1.1 envelope (IgniAqua PR #89).
 * No fetch, secrets, backend authorization, attestation or public verification.
 * Source readback: IgniAqua draft/safespot-r0-contract-20261110
 * safespot/venue-feed-r1.mjs @ e383e6567e273a82bb1d5237741d1b904d5014b8.
 * This is a compatibility boundary, NOT a copied venue producer.
 */
import { normalizeSafeSpotForAcreEra } from "./safespot-adapter.ts";
import type { SafeSpotAdapterResponse } from "./safespot-fixtures";
export type SafeSpotContractResult = {
  state: "FICTIONAL_CONTRACT_MATCH" | "REJECTED_UNTRUSTED_FEED";
  reason: string;
  display: SafeSpotAdapterResponse;
};
const empty = (): SafeSpotAdapterResponse => normalizeSafeSpotForAcreEra({});
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
export function consumeIgniAquaSafeSpotR11(
  payload: unknown,
  now: Date = new Date()
): SafeSpotContractResult {
  const reject = (reason: string): SafeSpotContractResult => ({
    state: "REJECTED_UNTRUSTED_FEED", reason, display: empty(),
  });
  const feed = object(payload);
  if (!feed || feed.schemaVersion !== "igniaqua-safespot-public-venues-r1" ||
      feed.provider !== "IGNIAQUA_SAFESPOT" || feed.integration !== "OFFLINE_DRAFT" ||
      feed.client !== "ACRE_ERA") return reject("Unsupported producer, schema, integration or client");
  if (typeof feed.generatedAt !== "string" || !UTC.test(feed.generatedAt)) return reject("Missing UTC generation timestamp");
  const generated = Date.parse(feed.generatedAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs) || !Number.isFinite(generated) ||
      generated > nowMs + 5 * 60_000 || nowMs - generated > 24 * 60 * 60_000)
    return reject("Expired or future-dated fictional feed");
  if (!Array.isArray(feed.places) || feed.places.length > 100) return reject("Invalid venue collection");
  // The offline producer never authenticates a venue. Reject unrecognized status
  // rather than permitting an invented producer to introduce trusted labels.
  const attributes = ["officialExchangeZone", "lighting", "cameras", "publicAccess", "operatingHours"];
  for (const candidate of feed.places) {
    const place = object(candidate);
    if (!place || typeof place.id !== "string" || !/^[a-z0-9_-]{3,64}$/.test(place.id) ||
        typeof place.label !== "string" || place.label.length > 120) return reject("Invalid venue record");
    const claims = object(place.attributes);
    if (!claims) return reject("Missing venue evidence");
    for (const key of attributes) {
      const claim = object(claims[key]);
      if (!claim || !["UNKNOWN","REPORTED"].includes(String(claim.status)) ||
          typeof claim.needsReview !== "boolean") return reject("Invalid claim or prohibited VERIFIED state");
    }
  }
  // Existing Acre Era adapter further strips GPS, private incident data, approval
  // records and venue identities, and never promotes to VERIFIED.
  return {
    state: "FICTIONAL_CONTRACT_MATCH",
    reason: "Offline draft structure accepted; no source authenticity or live connection",
    display: normalizeSafeSpotForAcreEra(feed),
  };
}
