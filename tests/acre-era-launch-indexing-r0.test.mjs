import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("Preview and staging metadata cannot advertise indexing", () => {
  assert.match(read("src/app/layout.tsx"), /robots: \{ index: publicIndexingEnabled\(\), follow: publicIndexingEnabled\(\) \}/);
  assert.match(read("src/app/robots.ts"), /if \(!publicIndexingEnabled\(\)\) return \{ rules: \[\{ userAgent: "\*", disallow: "\/" \}\] \}/);
  assert.match(read("src/app/sitemap.ts"), /if \(!publicIndexingEnabled\(\)\) return \[\]/);
});
test("Public URLs use an explicit configured origin, not an unverified domain", () => {
  for (const file of ["src/app/layout.tsx", "src/app/robots.ts", "src/app/sitemap.ts"]) {
    assert.doesNotMatch(read(file), /acreera\.com/);
    assert.match(read(file), /publicSiteUrl\(\)/);
  }
  assert.match(read("src/lib/public-site-url.ts"), /NORVANA_SITE_URL/);
  assert.match(read("src/lib/public-site-url.ts"), /VERCEL_ENV === "production"/);
  assert.match(read("src/lib/public-site-url.ts"), /configuredPublicOrigin\(\) !== null/);
  assert.match(read("src/lib/public-site-url.ts"), /url\.pathname !== "\/"/);
});
