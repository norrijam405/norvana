# NORVANA CJ LIVE READ PROBE — AUTHENTICATION FAIL

Date: 2026-09-29

Repository:
`norrijam405/norvana`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Purpose

Run exactly one real CJdropshipping read-only authentication/probe after Norris securely bound `NORVANA_CJ_API_KEY` in Vercel Preview.

## Exact executable lineage

Live-read source candidate with path trigger:

`a80e8fb35e57e0673c5dcfeb4f4b7a3b0680a996`

CI:

`36637962286 — SUCCESS`

Passed:
- dependency/security gates;
- Watchtower regressions;
- Supplier Gateway regressions;
- CJ offline qualification tests;
- CJ live-read mocked probe tests;
- TypeScript;
- ESLint;
- production build.

## Controlled Preview

Deployment gate:

`4c7f218eb503c6e78efa47c914cfb5a37b6434e7`

Deployment:

`dpl_8xpRrtPVxURpKmo96Yy93Y7skvri`

URL:

`https://norvana-2hsmcxk48-norrijam405-2107s-projects.vercel.app`

State:

`READY`

Region:

`iad1`

Refreeze:

`09dbc231c63a127673f61601b46ca63c59ea3de1`

Refreeze CI:

`36638150687 — SUCCESS`

No deployment sourced from the refreeze commit was observed.

## Probe result

Protected route:

`/api/suppliers/cj/live-probe/run`

HTTP result:

`502`

Application result:

```json
{
  "result": "FAIL",
  "code": "SUPPLIER_AUTH_INVALID",
  "finalState": "STOPPED_NO_ORDER_NO_PUBLICATION"
}
```

The Vercel key-binding check was passed, meaning a `NORVANA_CJ_API_KEY` value was present in the Preview environment.

The failure occurred during CJ authentication before product, stock, warehouse, freight, order, publication, or payment work could proceed.

No CJ access token was returned to the client.
No token was persisted by the probe.
No product was published.
No order was created.
No fulfillment occurred.
No money moved.

## Interpretation

CJ rejected the credential/authentication.

The probe intentionally maps CJ authentication failures to `SUPPLIER_AUTH_INVALID` without returning the secret or token.

Given the account history, one plausible cause is that the Vercel value is the API key associated with the CJ API store that Norris deleted. That is not proven from this response alone.

CJ's current error documentation states authentication can fail when an API key is invalid or the API store is not authorized.

## Next safe action

Replace `NORVANA_CJ_API_KEY` in Vercel Preview with the API key copied from the currently Activated/Authorized **Norvana** API store.

Do not paste the key into chat, GitHub, screenshots, or source.

After replacement, run exactly one new read-only probe.

Do not retry the current credential blindly.

## Truth state

`CJ_LIVE_READ_PROBE_AUTH_FAIL`

Not authenticated.
Not live-catalog proven.
Not live-stock proven.
Not live-freight proven.
Not READ_ONLY_SHADOW_VERIFIED.
