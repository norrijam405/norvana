import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("homepage prioritizes direct shopping navigation instead of fake preview product cards", () => {
 const page = read("src/components/acre-era/between-eras-home.tsx");
 assert.match(page, /Find your next good thing/);
 assert.match(page, /Explore the store/);
 assert.match(page, /showPreviewProducts=\{false\}/);
 assert.doesNotMatch(page, /HOME_PREVIEW_PRODUCTS/);
 assert.match(page, /href: "\/shop"/);
 assert.match(page, /href: "\/market"/);
 assert.match(page, /href: "\/partners"/);
});
test("customer header does not expose internal admin as a shopping menu item", () => {
 const nav = read("src/components/navbar.tsx");
 assert.doesNotMatch(nav, /href="\/admin"/);
 assert.match(nav, /label: "Goods Era"/);
});
