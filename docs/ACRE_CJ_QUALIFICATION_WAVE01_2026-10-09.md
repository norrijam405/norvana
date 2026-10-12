# ACRE CJ QUALIFICATION WAVE 01

Date: 2026-10-09
Mission: ACRE-PRODUCT-OPS-001
Source: current official CJdropshipping product pages + official CJ dispute/return policy
Authority: OBSERVE / RECOMMEND ONLY

## Critical route-truth correction

CJ public product pages can display:
- Inventory: --
- Estimated Processing Time: --
- Estimated Delivery Time: --
- Shipping Cost: 0.00

while also requiring sign-in for an actual shipping calculation.

Therefore:

- SHIPPING_COST_0_WITHOUT_CALCULATED_ROUTE != FREE_SHIPPING
- INVENTORY_DASH != IN_STOCK
- MISSING_PROCESSING != ZERO_PROCESSING_TIME
- MISSING_DELIVERY != FAST_DELIVERY

These states are UNKNOWN and block READY_SUPPLIER.

## CJ return/dispute operating risk

Current official CJ policy indicates:
- U.S. delayed-order disputes use a 45-day post-departure threshold;
- returns generally route to CJ China warehouses;
- CJ states it does not recommend returns because international return cost/time is high;
- the U.S. warehouse generally does not accept standard returns;
- some "buyer changed mind / buyer does not like it" cases are not accepted disputes.

Operational implication:
Acre Era should prefer products with low expected return burden and simple quality verification.
Return friction must be included in the product memo and margin reserve.

## Candidate qualification

### 1. Magnetic Cable Clip / Under-Desk Cable Organizer
CJ SKU: CJYD197888501AZ
Observed product price: $0.05–$8.45 depending variant/pack
Observed weight band: 20–1,268 g
Observed product attributes: ABS/plastic; adhesive mounting; up to 2kg stated max load.
State: HOLD

Positive:
- simple everyday utility;
- broad home-office/tech fit;
- easy demo;
- potentially light/compact variants.

Blockers:
- inventory UNKNOWN;
- U.S. route shipping UNKNOWN;
- processing time UNKNOWN;
- delivery window UNKNOWN;
- adhesive durability not independently verified;
- huge variant/weight spread makes one margin assumption unsafe.

Next:
qualify one exact variant only, not the entire SPU.

### 2. Desktop Folding Multi-Angle Full-Alloy Phone Holder
CJ SKU: CJSJ228498801AZ
Observed product price: $0.53–$0.76
Observed weight: ~90 g
Material: alloy
State: HOLD / HIGH-PRIORITY ROUTE CHECK

Positive:
- simple;
- small/light;
- universal-use positioning;
- low apparent support burden;
- strong demo/gift/desk fit.

Blockers:
- inventory UNKNOWN;
- U.S. shipping UNKNOWN;
- processing/delivery UNKNOWN;
- low unit price means shipping can destroy contribution;
- stability/build-quality not independently verified.

Next:
one exact color/variant + landed U.S. cost.

### 3. Metal Rotating Desktop Folding Mobile Phone Bracket
CJ SKU: CJSJ206576301AZ
Observed product price: $1.40–$1.62
Observed weight: ~150 g
Material: alloy
State: HOLD / HIGH-PRIORITY ROUTE CHECK

Positive:
- simple;
- useful;
- visually demonstrable;
- modest unit cost;
- likely lower support burden than powered electronics.

Blockers:
- inventory UNKNOWN;
- U.S. shipping UNKNOWN;
- processing/delivery UNKNOWN;
- hinge durability/stability unverified.

### 4. Portable Washable Hair Remover with Adhesive Roller
CJ SKU: CJJT174982701AZ
Observed product price: $2.63–$4.75
Observed weight: ~268–449 g
State: HOLD

Positive:
- evergreen pet/home problem;
- reusable;
- strong before/after demonstration;
- no electronics.

Blockers:
- inventory UNKNOWN;
- U.S. shipping UNKNOWN;
- processing/delivery UNKNOWN;
- adhesive longevity and fabric-safety claims not independently verified;
- return friction matters if performance disappoints.

### 5. 2-in-1 Pet Hair Removal Roller
CJ SKU: CJMY200580801AZ
Observed product price: $1.39–$5.80
Observed weight: ~170–511 g
State: HOLD

Positive:
- pet/home evergreen use;
- demo-friendly;
- no batteries.

Blockers:
- same route-truth gaps as above;
- performance/durability evidence weak;
- multiple variants create economics ambiguity.

### 6. Reusable Pet Hair Remover / Lint Roller
CJ SKU: CJMY210365701AZ
Observed product price: $13.78
Observed weight: ~500 g
State: HOLD / LOWER PRIORITY

Reason:
Price and weight are materially higher than the simpler pet-hair candidates before shipping is even known.
Needs a stronger quality/value case to justify advancing.

### 7. 4-Layer Slow Feeder Puzzle Dog Bowl
CJ SKU: CJMY202610501AZ
Observed product price: $2.00
Observed weight: ~430 g
State: HOLD

Positive:
- recognizable pet-enrichment use case;
- easy merchandising story.

Blockers:
- route economics unknown;
- material/cleanability quality not independently verified;
- pet-health language on supplier copy should not be repeated as medical/health proof.

### 8. Dog Puzzle Feeder / Duck Design
CJ SKU: CJYD229494801AZ
Observed product price: $0.66–$2.30
Observed weight: ~434–808 g
State: HOLD / LOWER PRIORITY

Reason:
Very low product cost paired with relatively high weight means shipping may dominate economics.
Quality and cleaning experience also require validation.

### 9. Dog Tumbler Interactive Slow Feeder
CJ SKU: CJYD196025501AZ
Observed product price: $2.30
Observed weight: ~340–429 g
State: HOLD

Positive:
- demo-friendly;
- no electricity;
- enrichment angle.

Blockers:
- route economics unknown;
- durability/material claims unverified;
- do not repeat supplier gastrointestinal/health claims as Acre Era claims.

### 10. Adjustable Treat Dispenser Toy
CJ SKU: CJGY208454401AZ
Observed product price: $9.18
Observed weight: ~200 g
State: HOLD / LOWER PRIORITY

Reason:
Higher supplier cost than competing pet-enrichment candidates. Needs better evidence of quality/demand to beat cheaper options.

## Current ranking for next route check

1. CJSJ228498801AZ — alloy phone stand
2. CJSJ206576301AZ — rotating alloy phone stand
3. CJYD197888501AZ — cable organizer, exact light variant only
4. CJJT174982701AZ — washable pet hair roller
5. CJMY200580801AZ — 2-in-1 pet hair roller

## Wave result

READY_SUPPLIER: 0
HOLD: 10
REJECT: 0

This is a successful fail-closed result, not a failed Scout run.

The public catalog evidence is sufficient to shortlist products but not sufficient to prove:
- U.S. landed cost;
- current stock;
- processing;
- delivery window.

Those four facts must be obtained from a signed-in route calculation or another durable CJ source before READY_SUPPLIER.

## Founder action

None required yet unless no automated/connected way to retrieve signed-in CJ route details becomes available.

Do not import, connect store, enable fulfillment, order, or publish.
