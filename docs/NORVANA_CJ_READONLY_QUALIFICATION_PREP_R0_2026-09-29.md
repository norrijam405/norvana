# NORVANA — CJ DROPSHIPPING READ-ONLY QUALIFICATION PREP R0

Date: 2026-09-29

Repository:
`norrijam405/norvana`

Supplier Gateway foundation:
`BANKED_SUPPLIER_GATEWAY_R0_FOUNDATION`

Exact banked Supplier Gateway candidate:
`cb532476ae79f7b09c473824178a31d0774a12a3`

Supplier target:
`CJdropshipping`

## Mission

Prepare Norvana to qualify CJdropshipping as the first real general-merchandise supplier in READ-ONLY mode.

Do every safe preparation step possible without creating, requesting, exposing, storing, or using a real supplier credential.

## Required preparation

1. Define exact CJ read-only capability map for:
   - catalog search;
   - product read;
   - variant read;
   - inventory read;
   - warehouse read;
   - freight/shipping quote;
   - delivery estimate where supported;
   - webhook verification where supported;
   - local order simulation only.

2. Create provider-specific DTO/normalization contracts behind the common Supplier Gateway interface.

3. Create deterministic local CJ response fixtures for:
   - product;
   - variant;
   - stock;
   - warehouse;
   - freight quote;
   - error/rate-limit responses.

4. Prove normalization into Norvana's provider-neutral model.

5. Add fail-closed behavior for:
   - missing credential;
   - invalid credential;
   - account entitlement not verified;
   - rate-limit;
   - malformed provider response;
   - missing stock;
   - missing freight;
   - unknown currency;
   - unsupported capability.

6. Ensure no CJ adapter method can:
   - create an order;
   - cancel an order;
   - activate a supplier;
   - publish a product;
   - fulfill;
   - refund;
   - change price;
   - spend money.

7. Define credential custody requirements without creating the credential.

8. Define the exact founder-live checklist for account binding:
   - CJ account exists;
   - current API entitlement confirmed;
   - least-privilege credential created;
   - credential entered only into approved secret store;
   - credential never pasted into chat/GitHub;
   - read-only proving request selected;
   - no order/payment scope used.

9. Define the first live proving sequence:

```
authenticate
-> catalog query
-> SKU normalization
-> stock read
-> warehouse read
-> product cost read
-> freight quote
-> delivery estimate
-> normalized landed cost
-> local simulated order object
-> STOP
```

No order submission.

## Stop gate

STOP before:

- logging into CJ on Norris's behalf unless explicitly authorized at that point;
- creating a CJ account;
- creating an API credential;
- binding a credential;
- storing a credential;
- making a real authenticated CJ API request;
- enabling external supplier network calls in production/Preview;
- publishing;
- ordering;
- spending.

When all offline preparation is complete, produce a founder-live handoff with the smallest possible next action.

NO FAKE PASS.
