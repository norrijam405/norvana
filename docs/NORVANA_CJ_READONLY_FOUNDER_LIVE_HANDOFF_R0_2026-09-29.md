# NORVANA — CJ READ-ONLY FOUNDER-LIVE HANDOFF R0

Date: 2026-09-29

Repository: `norrijam405/norvana`  
PR: `#2`  
Branch: `feature/2026-09-29-norvana-supplier-gateway-r0`

Offline Builder candidate:
`6250eec47a3746baf8bbae5cf5a2b3783fbce5ae`

Offline Builder CI:
`36650016785 — SUCCESS`

Current truth:
`CJ_READONLY_OFFLINE_PREP_BUILDER_PASS`

## What is already done

Norvana is prepared offline for CJ read-only qualification.

Prepared and tested:
- exact read-only capability map;
- provider-specific internal DTO contracts;
- deterministic local CJ fixtures;
- normalization to provider-neutral Norvana models;
- fail-closed credential/entitlement/rate-limit/malformed/unknown-data behavior;
- local landed-cost simulation;
- local non-executable order simulation;
- zero consequential CJ adapter methods.

No CJ secret has been requested, created, stored, pasted, or used.

## Smallest founder-live next action

The next action is **account-level entitlement confirmation only**.

Norris should sign in to the official CJdropshipping account directly and confirm that the account currently has developer/API access for the read-only proving capabilities needed by Norvana.

Do **not** paste any credential, API token, access token, secret, QR payload, recovery code, or password into ChatGPT or GitHub.

Do **not** create a credential yet if there is no approved secret destination ready to receive it.

## Founder-live checklist

Before the first authenticated request, all of the following must be true:

- [ ] CJ account exists and Norris controls it.
- [ ] Current API/developer entitlement is visible at account level.
- [ ] Required read capabilities are confirmed from current CJ documentation/account UI.
- [ ] No paid CJ plan is required merely to run the intended read-only proof, or any cost is explicitly surfaced before proceeding.
- [ ] An approved secret store has been selected.
- [ ] A least-privilege credential is created only after the secret store is ready.
- [ ] The credential is entered directly into that secret store.
- [ ] The credential is never pasted into chat, GitHub source, GitHub comments, logs, screenshots, or documentation.
- [ ] Preview/read-only environment is selected for the first proof.
- [ ] Supplier ordering, payment, publication, fulfillment, refund, repricing, and activation remain disabled.
- [ ] The first request is a bounded read-only catalog query.
- [ ] No order/payment scope is exercised.

## Credential-custody requirements

A live CJ secret must satisfy all of the following:

1. server-side only;
2. environment-scoped;
3. least privilege;
4. no client bundle exposure;
5. no source-control storage;
6. no log or receipt plaintext;
7. rotation/revocation procedure defined;
8. provider/account identity bound to the qualification record;
9. explicit environment binding;
10. no standing ACT authority created by possession of the credential.

The existing application route that rejects raw supplier credential storage remains authoritative until a dedicated approved secret-custody path is configured.

## First authenticated proving request

After entitlement and secret custody are verified, the first live sequence is:

```
authenticate
-> bounded catalog query
-> normalize one returned product/SKU
-> read stock
-> read warehouse
-> read product cost
-> obtain freight quote
-> obtain delivery estimate when supported
-> calculate normalized landed cost
-> create local simulation object
-> STOP
```

Expected final authority state:
`READ_ONLY_PROVING_ONLY`

Forbidden:
- create order;
- submit order;
- cancel order;
- publish product;
- activate supplier;
- fulfill;
- refund;
- change price;
- spend money.

## Evidence to capture during live proving

Capture only non-secret evidence:
- account-level API entitlement state;
- provider/API version or documentation reference;
- request capability;
- request timestamp;
- normalized request hash;
- response status;
- provider product/SKU identifiers;
- stock/warehouse/cost/freight/delivery fields actually returned;
- unknown/null fields;
- rate-limit headers/state if exposed;
- normalization output;
- local landed-cost result;
- local simulation result;
- STOP confirmation.

Never capture the credential itself.

## Next role after successful live read proof

A separate Challenger should attack:
- credential isolation;
- entitlement truth;
- response normalization;
- unknown-data handling;
- rate-limit handling;
- currency handling;
- replay/retry behavior;
- absence of action authority;
- proof provenance.

No self-certification of `READ_ONLY_SHADOW_VERIFIED`.
