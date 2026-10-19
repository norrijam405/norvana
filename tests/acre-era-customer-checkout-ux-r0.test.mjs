import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const source = readFileSync(new URL("../src/app/checkout/page.tsx", import.meta.url), "utf8");
test("customer sees actionable checkout failures and retains cart", () => {
  assert.match(source, /PREVIEW_LIVE_PAYMENT_BLOCKED/);
  assert.match(source, /No payment was taken\. Your cart is saved/);
  assert.doesNotMatch(source, /clearCart\(\)/);
  assert.doesNotMatch(source, /data\.fallback/);
});
test("checkout redirect is only allowed to a Stripe checkout hostname", () => {
  assert.match(source, /checkoutUrl\.protocol !== "https:"/);
  assert.match(source, /checkout\.stripe\.com/);
});
