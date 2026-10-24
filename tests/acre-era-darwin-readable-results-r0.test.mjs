import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/components/admin/intelligence-workbench.tsx", import.meta.url), "utf8");

test("Darwin shows a human-readable operator scenario and keeps raw evidence inspectable", () => {
  assert.match(source, /Operator scenario · unverified inputs/);
  assert.match(source, /Estimated contribution \/ unit/);
  assert.match(source, /Estimated contribution margin/);
  assert.match(source, /Inspect Darwin decision details \(JSON\)/);
});
test("economics deduct entered product, delivery, payment, and return expenses", () => {
  assert.match(source, /\["productCost", "shipping", "paymentFee", "returnReserve"\]/);
  assert.match(source, /darwinSummary.sale - darwinSummary.expenses/);
  assert.match(source, /exclude taxes, marketing, overhead/);
});
test("delivery statistics are identified as simulated, not real fulfillment evidence", () => {
  assert.match(source, /deliveryOnTime: onTime \+ late > 0/);
  assert.match(source, /Delivery observations/);
  assert.match(source, /simulated/);
  assert.match(source, /not verified supplier facts/);
});

test("operator-provided sources do not silently become verified evidence", () => {
  assert.match(source, /Evidence status: NOT VERIFIED/);
  assert.match(source, /operator claim only/);
  assert.match(source, /Evidence observation date/);
  assert.match(source, /needs refresh/);
  assert.match(source, /Future date — invalid for current evidence/);
  assert.match(source, /not supplier authentication/);
});

test("evidence date parsing accepts ISO dates rather than literal slash characters", () => {
  assert.ok(source.includes(String.raw`/^\d{4}-\d{2}-\d{2}$/`));
  assert.ok(!source.includes(String.raw`/^\\d{4}-\\d{2}-\\d{2}$/`));
});
test("manual delivery simulation bounds finite counts and rejects invalid timing", () => {
  assert.match(source, /Number\.isFinite\(value\) \? Math\.max\(0, Math\.min\(500, Math\.floor\(value\)\)\) : 0/);
  assert.match(source, /const onTime = boundedCount\("onTimeCount"\)/);
  assert.match(source, /const late = boundedCount\("lateCount"\)/);
  assert.match(source, /Number\.isFinite\(value\) && value >= 0/);
  assert.match(source, /Handling and transit days must be finite, nonnegative numbers/);
});
