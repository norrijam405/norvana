# ACRE SCOUT ACCURACY + POST-LAUNCH POLICY R0

Date: 2026-10-09
Mission: ACRE-PRODUCT-OPS-001
Authority: DECISION SUPPORT ONLY

## Purpose

Grade Scout recommendations against observed business outcomes instead of treating discovery quality as permanent truth.

## Forecast accuracy

Minimum sample:
- 5 settled orders.

Before that:
- state = INSUFFICIENT_DATA;
- no accuracy score;
- no performance-driven merchandising decision.

After minimum sample:
- compare projected contribution per order to observed contribution per settled order;
- calculate forecast accuracy;
- classify bias as ON_TARGET, OVER_ESTIMATED, or UNDER_ESTIMATED.

## Initial post-launch policy

LEARN
- fewer than 5 settled orders.

REMOVE
- observed contribution per settled order is non-positive; or
- observed return rate >= 20%.

REPRICE
- positive contribution remains, but observed contribution is more than 35% below forecast.

DEMOTE
- at least 50 outbound visits and observed conversion < 0.5%.

PUSH
- observed contribution >= 110% of forecast;
- return rate <= 8%;
- observed conversion >= 2%.

KEEP
- positive economics without a stronger policy signal.

## Important

These are R0 decision-support thresholds, not universal truths.
Specialist feedback and real Acre Era operating data may justify changing them.

A recommendation does not automatically publish, remove, reprice, or promote anything.

POST_LAUNCH_DECISION != EXECUTION_AUTHORITY
