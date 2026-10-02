# NORVANA SUPPLIER GATEWAY R0 — FRESH CHALLENGER ACTIVATION

Date: 2026-09-29

You are being activated as a **separate Fresh Challenger** for Norvana Supplier Gateway R0.

Repository:
`norrijam405/norvana`

Branch:
`feature/2026-09-29-norvana-supplier-gateway-r0`

Base:
`recovery/2026-09-26-norvana-modernization-r0`

Begin with:
`docs/NORVANA_SUPPLIER_GATEWAY_R0_SUCCESSOR_HANDOFF_2026-09-29.md`

Then read:
`docs/NORVANA_SUPPLIER_GATEWAY_R0.md`
`docs/NORVANA_SUPPLIER_QUALIFICATION_MATRIX_2026-09-29.md`
`docs/NORVANA_SUPPLIER_GATEWAY_R0_BUILDER_PROOF_2026-09-29.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.
You are not the Remediation Builder.
You are not Independent Assurance.
Do not repair defects in this role.

## Exact candidate

`6ae812a805fe754509fda2f81b5aba896da843c2`

Builder CI:
`36588969409 — SUCCESS`

## Required attack

At minimum attack:

1. **R0 authority escape**
   - order.create
   - fulfillment.execute
   - refund
   - supplier.activate
   - product.publish
   - price.change
   - cancellation
   - autoFulfill

2. **Legacy bypass**
   - old fulfillment route
   - supplier product import route
   - supplier create/update
   - legacy connector submitOrder methods
   - determine whether any reachable route still calls them

3. **Truth inflation**
   - source research must not become account-level entitlement proof
   - supplier-fit hypothesis must not become supplier binding
   - target retail must not become customer price
   - UNKNOWN stock/shipping/landed cost must stay UNKNOWN

4. **Supplier registry**
   - Printify entitlement ambiguity remains fail-closed
   - Spocket/AppScenic remain excluded from free fulfillment
   - provider priorities do not grant authority
   - excluded/hold providers cannot be used through read-only scaffolds

5. **Product Lab**
   - no add-to-cart
   - no checkout
   - no publish
   - no fake stock
   - no fake supplier SKU
   - no external network call
   - no claim that simulated products are currently available

6. **Credentials / secrets**
   - no new credentials
   - no raw secret persistence added
   - no account binding
   - no supplier network call before credential/account proving

7. **Provider neutrality**
   - supplier-specific facts remain behind normalized contracts
   - storefront/Scout/Operations do not need provider-specific order APIs

8. **Regression**
   - Watchtower safety remains intact
   - supplier work does not weaken recovery locks or federation gates

If a defect is found:
- issue a stable finding ID `NSG-R0-CHAL-XX`;
- preserve exact evidence;
- STOP without repair.

If no defect is established:
- issue Fresh Challenger PASS bound only to `6ae812a805fe754509fda2f81b5aba896da843c2`.

No live supplier accounts.
No orders.
No publishing.
No spend.
NO FAKE PASS.
