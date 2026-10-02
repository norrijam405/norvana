# Norvana Supplier Qualification Matrix — 2026-09-29

**Truth state:** SOURCE_RESEARCH_RECEIVED / NOT ACCOUNT-BOUND / NOT READ-ONLY-SHADOW-VERIFIED

| Provider | Lane | Priority | Disposition | Qualification | API entitlement | R0 note |
| --- | --- | ---: | --- | --- | --- | --- |
| CJdropshipping | General merchandise | 1 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | First read-only proving adapter |
| Banggood | General merchandise | 2 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | Provider-neutrality proving adapter |
| EPROLO | General merchandise | 3 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | Redundancy / global catalog |
| Gelato | POD | 1 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | First POD proving target |
| Prodigi | POD | 2 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | API-first POD |
| Printful | POD | 3 | QUALIFY | EVIDENCE_COLLECTED | SOURCE_REPORTED_FREE | Branding/white-label candidate |
| Printify | POD | 4 | HOLD | EVIDENCE_COLLECTED | NEEDS_ACCOUNT_VERIFICATION | Current custom-API entitlement ambiguity |
| Spocket | General merchandise | — | EXCLUDE | DISCOVERED | NOT_FREE_FOR_FULFILLMENT | Preserve false-positive rejection |
| AppScenic | General merchandise | — | EXCLUDE | DISCOVERED | NOT_FREE_FOR_FULFILLMENT | Free browse/connect is not free fulfillment |

## Required evidence before API entitlement can become VERIFIED

For a provider to advance to `API_ENTITLEMENT_VERIFIED`, preserve:

- exact provider account/tier;
- exact allowed API capability;
- current pricing/entitlement evidence;
- credential custody plan;
- request/response proof that does not perform a consequential action;
- rate-limit/quota evidence;
- provider terms relevant to Norvana's intended use;
- timestamp and source;
- durable receipt.

## General-merchandise proving sequence

```
account entitlement
-> authentication proof
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

## POD proving sequence

```
account entitlement
-> authentication proof
-> catalog read
-> variant/cost read
-> shipping quote
-> production/delivery estimate
-> branding option read
-> return/defect policy normalization
-> webhook proof where available
-> local simulated order object
-> STOP
```

No order submission.
