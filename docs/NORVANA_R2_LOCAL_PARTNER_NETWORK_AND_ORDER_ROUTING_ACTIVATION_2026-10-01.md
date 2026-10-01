# NORVANA R2 — LOCAL PARTNER NETWORK & ORDER ROUTING ACTIVATION

Date: 2026-10-01

Repository: `norrijam405/norvana`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Base:

`main@88df5ac3f976d508985ffa0de58d77091759cff4`

## Predecessor truth

Norvana Watchtower R1 bounded recurring Local Producer Watch completed controlled activation and post-activation Independent Assurance.

R1 remains a separate, proven observation lane.

R2 is a new mission. It must not rewrite, weaken, or silently broaden R1.

## Product mission

Build Norvana's provider-neutral Local Partner Network and order-routing recommendation layer.

Wave 1 prioritizes local farms and local/regional food businesses while keeping the architecture extensible to:

- farms;
- ranches;
- CSAs;
- food hubs;
- farmers markets;
- bakeries;
- co-ops;
- local manufacturers;
- wholesalers;
- packers;
- refrigerated/cold-storage operators;
- couriers and local delivery partners;
- other local/regional businesses that can contribute to order fulfillment.

The long-term model is a network, not a one-supplier-per-order system.

## Authority ceiling

R2 authority is limited to:

`OBSERVE + RECOMMEND`

R2 may:
- discover public partner candidates;
- preserve source evidence and provenance;
- normalize candidate identities;
- qualify candidates;
- estimate compatibility with demand;
- compare candidate options;
- construct reviewable proposed fulfillment plans;
- identify gaps and alternates;
- recommend candidates for human onboarding review.

R2 may not:
- activate a supplier;
- create supplier credentials;
- place a supplier order;
- spend money;
- charge a customer;
- promise inventory;
- publish an offer as available inventory;
- alter customer orders;
- submit fulfillment;
- issue refunds;
- contact a candidate autonomously;
- change price;
- change delivery promise;
- activate ACT authority.

Existing operational supplier and fulfillment APIs remain outside R2 authority.

## Architectural separation

Existing `suppliers`, `supplierCredentials`, `supplierProducts`, `supplierOrders`, and fulfillment routes are operational commerce state.

R2 must not write unverified discovered businesses directly into those tables.

R2 must introduce a separate pre-operational Partner Network truth layer.

Promotion from an R2 partner candidate into the operational supplier system is a future separately-governed mission requiring explicit human approval.

## R2 truth model

Partner information must use explicit evidence states.

Minimum states:

- `DISCOVERED`
- `EVIDENCE_VERIFIED`
- `RECOMMENDED`
- `REJECTED`
- `STALE`

No R2 state is equivalent to an active supplier.

Claims about price, inventory, delivery area, lead time, certifications, wholesale terms, or product availability must carry provenance and observation time.

Unknown data must remain unknown.

Do not silently infer:
- current inventory;
- current pricing;
- wholesale access;
- service radius;
- certification;
- food-safety status;
- minimum order;
- delivery capability.

## Wave 1 discovery sources

Prefer public/official evidence first.

Initial source families include:

- USDA Agricultural Marketing Service Local Food Directories;
- USDA Farmers Market Directory;
- USDA CSA Directory;
- USDA Food Hub Directory;
- USDA On-Farm Market Directory;
- USDA local/regional food-sector resources;
- state Departments of Agriculture;
- Cooperative Extension directories;
- official/local government business directories where appropriate.

Third-party discovery may be added later, but it must remain evidence-labeled and may not override official evidence silently.

## Partner identity model

Every candidate should be able to represent:

- canonical candidate id;
- business name;
- partner type;
- website/source identity;
- contact channels when publicly listed;
- address/location evidence;
- service area evidence;
- product/category claims;
- wholesale/retail/direct-to-consumer claims;
- fulfillment capabilities;
- pickup/delivery claims;
- lead-time claims;
- minimum-order claims;
- cold-chain/refrigeration claims;
- seasonality;
- certifications/licensing evidence;
- source evidence;
- last observed time;
- confidence/verification state;
- human review state.

## Order-routing recommendation model

R2 routing accepts demand and partner evidence and returns a proposal only.

A proposed plan may allocate different order lines across multiple partners.

Every plan must disclose:
- which demand lines are covered;
- which remain uncovered;
- partner allocations;
- evidence age;
- known cost evidence;
- unknown cost fields;
- availability confidence;
- fulfillment assumptions;
- service-area assumptions;
- warnings;
- rationale;
- whether human verification is required.

No plan may represent unknown inventory or unknown price as confirmed.

No plan may submit an order.

## Network objective

R2 should support fallback and aggregation.

Examples:
- Farm A cannot cover a line -> recommend Farm B;
- multiple farms can cover one basket -> propose a split plan;
- a food hub can aggregate multiple producer lines -> identify it as an aggregation node;
- direct farm pickup vs local courier delivery -> represent both as alternatives;
- cold-storage or packing requirements -> surface required intermediary capabilities.

## Cost discipline

Stay as close to $0 operating cost as practical.

Prefer:
- public data;
- open APIs;
- source-controlled deterministic logic;
- free-tier infrastructure already in use.

Do not activate paid external services in the R2 Builder lane.

## R2 Wave 1 Builder scope

The first executable R2 candidate should establish:

1. provider-neutral partner candidate types;
2. explicit evidence/truth states;
3. partner qualification policy;
4. deterministic recommendation scoring with explainable components;
5. multi-partner proposed fulfillment-plan construction;
6. hard prohibition on ACT/ordering side effects;
7. tests for unknown/stale evidence and partial coverage;
8. source registry for official/public discovery families;
9. no operational supplier-table writes;
10. no deployment.

Database persistence and discovery ingestion may be added after the pure contract survives challenge.

## Builder completion gate

Builder PASS requires:

- source-controlled R2 contract;
- deterministic tests;
- no operational supplier mutation path;
- no order/fulfillment mutation path;
- typecheck PASS;
- lint PASS;
- production build PASS;
- dependency/security gates PASS;
- no deployment;
- immutable candidate;
- separate Fresh Challenger activation.

Do not self-challenge.
