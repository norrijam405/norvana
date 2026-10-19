import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const route = readFileSync(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8");
test("staging refuses Stripe live credentials before creating orders", () => {
 assert.match(route, /VERCEL_ENV !== "production"/);
 assert.match(route, /STRIPE_SECRET_KEY\?\.startsWith\("sk_live_"\)/);
 assert.match(route, /PREVIEW_LIVE_PAYMENT_BLOCKED/);
 assert.ok(route.indexOf("PREVIEW_LIVE_PAYMENT_BLOCKED") < route.indexOf("db.select().from(products)"));
});
test("malformed checkout payloads and null cart entries are rejected", () => {
 assert.match(route, /!body \|\| typeof body !== "object" \|\| Array\.isArray\(body\)/);
 assert.match(route, /item && typeof item === "object" && !Array\.isArray\(item\)/);
});
