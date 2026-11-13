# Acre Era ↔ IgniAqua SafeSpot R1.1 consumer handshake
Date: 2026-11-12. Status: DRAFT CODE, SYNTHETIC DATA ONLY, NOT CONNECTED.

## Single owner, no duplicate producer
- IgniAqua owns the actual venue-evidence producer and later identity/incident services: [draft PR #89](https://github.com/norrijam405/IgniAqua-Control-Plane/pull/89).
- Acre Era owns the storefront, safety coverage UX and conservative consumer rendering: [draft PR #28](https://github.com/norrijam405/norvana/pull/28).
- Upstream pinned source: `safespot/venue-feed-r1.mjs` blob `e383e6567e273a82bb1d5237741d1b904d5014b8` on `draft/safespot-r0-contract-20261110`, reviewed against upstream PR head `82fa3603f978cab463415cde879a6d956d874bc9`.
- We did NOT copy the producer, call an API, import administrator credentials, create a second Watchtower or deploy IgniAqua.

## Actual delivered contract gate
`src/lib/garage-sale/safespot-r11-contract.ts` expects:
- `schemaVersion: igniaqua-safespot-public-venues-r1`
- `provider: IGNIAQUA_SAFESPOT`; `integration: OFFLINE_DRAFT`; `client: ACRE_ERA`
- a valid UTC `generatedAt` not more than 24 hours old or more than 5 minutes ahead of evaluation time
- at most 100 venue records, with safe IDs and five separate evidence attributes
- each claim must be `UNKNOWN` or `REPORTED` and include `needsReview`
- rejects any claimed `VERIFIED` from this unauthenticated offline producer
- converts the accepted *synthetic* response through Acre Era's existing privacy-limiting adapter (30 venue UI limit), never publishing exact coordinates, addresses, incidents or original approval records
- rejects malformed/stale/unexpected feed envelopes entirely; no optimistic fallback to "verified"

The original fictional exchange-location selector is now built from a **producer-shaped fixture** passing through this same gate. This is a *schema handshake in the Preview UI*, not an actual SafeSpot data connection. In particular, no server-to-server authentication or official-source verification is demonstrated.

## Evidence
- Commits: `414608b9` R1.1 contract gate; `60f3ea1f` route existing fictional selector through fixture; `b67406b4207205dc9eea1057b13c11c906d57ab8` four added regression tests.
- Exact executable SHA: `b67406b4207205dc9eea1057b13c11c906d57ab8`.
- Vercel deployment: `dpl_2C5rC54m323v1vSovZfr3KKSVYVj` READY. Preview: https://norvana-gydsxyuey-norrijam405-2107s-projects.vercel.app/garage-sale
- External Vercel build: `npm run test:garage-sale` 30 PASS, 0 FAIL; Next compile and TypeScript succeeded; `/garage-sale` generated. No runtime browser E2E or actual producer test in this Acre Era build.
- Prior IgniAqua SafeSpot PR #89: 9/9 targeted source checks with URL shim reported; its 21-assertion Node suite not independently executed in clean Node at handoff. Do not upgrade that evidence.

## Security limitations and next authorization gates
1. Source authenticity: a JSON envelope can claim `provider: IGNIAQUA_SAFESPOT`; matching strings is NOT authorization. Reject public live traffic until trusted service-to-service authentication, signed or otherwise attested exact outputs and independent official-source evidence review are implemented.
2. Location: location presence is not a safety guarantee. Individual designation, lighting, hours, access and cameras require separate evidence, expiry and honest uncertainties. No public VERIFIED labels from the offline producer.
3. User data: protect private addresses, seller/buyer identities, reports and meetup history behind consent, least privilege, retention and escalation rules; never mirror confidential incident data into listings.
4. Marketplace coverage: safety-coverage.ts remains the Acre Era vertical layer for Market/farms, Goods, Finds/affiliates, Era Drops, delivery, payments, messaging and Garage Sale. IgniAqua owns only shared safety intelligence, not Acre Era checkout/vendor enforcement.
5. Before live wiring: IgniAqua approves an authenticated read-only endpoint/attestation contract; Acre Era adds negative server-auth/tenant tests, browser E2E, response-rate/expiry policy, mobile-device review and rollback. User must authorize any production promotion, infrastructure changes, paid services or permission changes.
