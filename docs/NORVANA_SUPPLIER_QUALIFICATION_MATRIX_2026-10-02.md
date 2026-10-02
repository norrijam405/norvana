# Norvana Supplier Qualification Matrix — 2026-10-02

**Truth state:** SOURCE_RESEARCH_RECEIVED / CODE-SCAFFOLDED / NOT ACCOUNT-BOUND / NOT AUTHORIZED TO EXECUTE

This matrix extends the 2026-09-29 Supplier Gateway evidence without granting supplier ACT authority.

| Provider | Lane | Priority | Disposition | API/custom-store state | R0 connector state |
| --- | --- | ---: | --- | --- | --- |
| CJdropshipping | General merchandise | 1 | QUALIFY | Source reports direct API | Existing qualification lane |
| Banggood Dropship | General merchandise | 2 | QUALIFY | Source reports free custom API | Read-only scaffold |
| EPROLO | General merchandise | 3 | QUALIFY | Source reports free custom API, account-rep access | Read-only scaffold |
| HyperSKU | General merchandise | 4 | HOLD | Custom Next.js interface not yet proven | Fail closed |
| Modalyst | General merchandise | 5 | HOLD | Retailer custom API entitlement not yet proven | Fail closed |
| Gelato | POD | 1 | QUALIFY | Source reports API selling on free account | Read-only scaffold |
| Prodigi | POD | 2 | QUALIFY | Source reports API-first custom integration | Read-only scaffold |
| Printful | POD | 3 | QUALIFY | Source reports direct API | Read-only scaffold |
| Merchize | POD | 4 | QUALIFY | Source reports free fulfillment plan with API access | Read-only scaffold added |
| Printify | POD | 5 | HOLD | Custom API entitlement remains account-level ambiguity | Fail closed |
| Spocket | General merchandise | — | EXCLUDE | Free offer reported as trial / paid fulfillment | Excluded |
| AppScenic | General merchandise | — | EXCLUDE | Free tier cannot push products or orders | Excluded |
| Syncee | General merchandise | — | EXCLUDE | Free tier reported as browse-only | Excluded |
| Zendrop | General merchandise | — | EXCLUDE | Free tier cannot process linked-product orders | Excluded |
| Supliful | POD | — | EXCLUDE | Free-tier customer orders held until paid upgrade | Excluded |

## What “set up” means in this R0 lane

For providers marked QUALIFY, Norvana has or receives a provider-neutral read-only adapter scaffold. The scaffold may expose only admitted proving capabilities such as catalog read, product/variant read, inventory read, freight/shipping quote, delivery estimate, return/branding policy read, webhook verification, and local order simulation.

All scaffolds remain unbound until a real provider account and credential entitlement are proven.

No provider in this matrix receives:

- order creation authority;
- payment/spend authority;
- product publication authority;
- supplier activation authority;
- refund/cancel authority;
- automatic fulfillment authority.

Those capabilities remain `LOCKED_R0`.

## New 2026-10-02 disposition

### Merchize

Admitted to the API-first POD qualification pool and added to `FIRST_WAVE_READ_ONLY_ADAPTERS`.

Qualification sequence:

`account entitlement -> auth proof -> catalog -> variant/cost -> shipping -> delivery -> returns/branding -> local simulated order -> STOP`

No order submission.

### HyperSKU

Economics/fulfillment research is promising, but direct arbitrary custom-store API support was not established by the supplied research. It remains HOLD with zero read capabilities until account/interface evidence closes that gap.

### Modalyst

The free-plan economics can be evaluated, but direct Next.js retailer API entitlement remains unverified. It remains HOLD and no read capability is admitted.

### Printify

The ordinary free POD plan remains in the research set, but custom API entitlement ambiguity remains unresolved. It remains HOLD.

## External account setup required

Code scaffolding cannot itself create or authorize supplier accounts.

For each QUALIFY provider, the next account-binding gate requires the owner/operator to create or authorize the provider account and provide the least-privilege API credential through the approved secret-storage path. Credentials must never be committed to GitHub.

After binding, prove only non-consequential reads first. Do not submit a live order as an authentication test.

## Required proof before a provider can advance

Preserve:

- exact provider account/tier;
- current API entitlement;
- credential custody path;
- authentication proof;
- one bounded catalog/product read;
- current quota/rate-limit evidence;
- shipping/freight evidence where supported;
- terms relevant to Norvana use;
- exact timestamp and source;
- normalized response receipt.

Then advance through read-only proving. Fulfillment remains a separate later authority decision.
