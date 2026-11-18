# Acre Era Digital Garage Sale × IgniAqua SafeSpot — R0 boundary
Status: FICTIONAL PREVIEW ONLY / NOT CONNECTED / NOT VERIFIED / NOT AUTHORIZED FOR LIVE SAFETY ACTIONS.
Ownership: Acre Era = consumer marketplace. IgniAqua = shared SafeSpot safety/evidence service.
Decisions: Acre Era issue #27; IgniAqua issues #85 and #88.

## Existing-system boundaries
- Reuse the existing Acre Era application and its single Watchtower. No new control panel or standalone app.
- Preserve Market Era, Era Drop and the original shopping flows.
- Fictional /garage-sale: two demo sales, selectable items, sample offers and a venue selector. No persistence, signup, checkout, payments, real messaging, booking or geolocation.
- SafeSpot selector calls a static typed fixture, not a real location directory. Every venue is fictional. No map coordinates are included.
- VISIBLE != CONNECTED != VERIFIED != AUTHORIZED.

## Proposed SafeSpot provider contract (owner: IgniAqua)
Consumer uses the versioned SafeSpotAdapterResponse shape from src/lib/garage-sale/safespot-fixtures.ts. A future live adapter must:
1. Require approved IgniAqua API contract, per-client authorization and least-privilege credentials. Never expose secrets in the client.
2. Only expose deliberately public venue fields, authoritative source URL, feature-specific evidence state and last-checked time. Do not return private addresses, identity, location history, or confidential incident details.
3. Verify designation, hours, lighting, staffing, surveillance, and accessibility independently. Community ratings must not be presented as official certification.
4. Treat expired/conflicting/missing evidence as UNKNOWN or NEEDS_RECHECK, never as VERIFIED. A verified fact does not guarantee safety.
5. Permit a fallback when SafeSpot declines or is unreachable. Browsing cannot depend on an operational safety API.
6. Require separate privacy, retention, moderation, authorization and legal review for real pickup scheduling, private messages and incidents.

## Threat model
| Threat | R0 control | Live launch gate |
| --- | --- | --- |
| Seller doxxing | No addresses or user identifiers | Private default and permission checks |
| False official location claims | All demo claims UNKNOWN | Traceable official source and expiry |
| Payment screenshot fraud | No transactions | Payment provider reconciliation |
| Intimidation or unsafe meetup | No chat or booking | Reporting, human moderation and escalation |
| Rating brigading | No ratings | Abuse controls, provenance and moderation |
| Harassment/spam | No messages | Rate limiting and reporting |
| Cross-app privacy leakage | No cross-app payload | IgniAqua permission and retention approval |
| Upload malware or illicit listings | No uploads | File scanning and listing moderation |
| Unauthorized purchase | No writes or checkout | AuthZ and approval gates |
| Closed or unsuitable venue | All access hours UNKNOWN | Fresh authoritative venue verification |

## Acceptance gates
- npm run test:garage-sale: fixture integrity, bundle totals, unknown venue states and no private user fields.
- npm run build: Next.js compilation, TypeScript and page build.
- Confirm exact Preview deployment, code SHA and active Acre Era hosting relationship before founder test.
- Confirm additive nav does not break existing Market and Watchtower.
- No production merge, real venues, real customer data, paid infrastructure, actual safety endorsements or purchases without separate authorization.
