# Acre Era Customer Language Boundary R0

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Scope:** customer-facing Acre Era surfaces

## Rule

Acre Era customer pages must present useful shopping information without exposing internal operating-system language.

Internal systems may include Watchtower, Darwin, IgniAqua, model/agent workers, evidence scores, qualification state machines, governance controls, assurance terminology, routing weights, or other backend mechanisms.

Those names and mechanisms remain behind the scenes unless a future product requirement explicitly makes one customer-facing.

## Customer-facing principle

Show the **result**, not the machinery.

Good customer language includes:

- current price;
- availability;
- expected delivery window;
- who the customer is buying from;
- who owns checkout;
- who fulfills;
- return policy;
- warranty;
- product condition;
- source/provenance information when relevant;
- whether information was checked recently;
- whether an item is from an archived collection;
- plain-language alerts such as price drop, back in stock, or delivery update.

Avoid customer-facing language such as:

- Watchtower is watching;
- Darwin selected this route;
- IgniAqua approved this;
- agent/model confidence;
- qualification score;
- route fitness;
- authorization pipeline;
- immutable snapshot;
- evidence circuit breaker;
- governance state;
- internal risk score.

## Trust rule

Do not replace backend jargon with vague reassuring claims.

If the system has real evidence, expose the useful fact in plain language.

If the system does not have evidence for a claim, omit it or state the uncertainty plainly.

## Audience

Customer language must remain comfortable for broad audiences, including:

- everyday shoppers;
- families;
- older adults;
- retirement communities;
- nursing-home residents and staff;
- customers with low technical literacy.

The shopping experience should feel calm, ordinary, and understandable even when sophisticated intelligence is operating behind it.

## Examples

Internal:
`WATCHTOWER_SUMMARY: supplier route reliability 0.94`

Customer:
`Expected delivery: Oct. 8–10`

Internal:
`Darwin route winner: supplier_b / UPS Ground`

Customer:
`Fulfilled by Supplier B · UPS Ground`

Internal:
`authorization_state = VERIFIED`

Customer:
`Sold by Example Store` or a specific provenance statement supported by evidence.

Internal:
`ARCHIVED snapshot resolver`

Customer:
`Shown as it appeared when this Era was active.`

## Enforcement

New customer-facing renderer, product, checkout, account, alert, archive, and delivery work should follow this boundary.

Internal admin/control-panel surfaces may continue to use the exact technical vocabulary required for operators and evidence review.
