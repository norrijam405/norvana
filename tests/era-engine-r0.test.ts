import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isEraMediaPublic,
  isPublicEra,
  normalizeThemeTokens,
  validateEraSections,
} from "../src/lib/era-engine/policy.ts";

test("Era media fails closed without explicit public rights evidence", () => {
  const base = {
    mediaUrl: "https://cdn.example.com/hero.mp4",
    rightsState: "LICENSED_STOCK",
    status: "APPROVED",
  };

  assert.equal(isEraMediaPublic({ ...base, rightsEvidenceRef: null }), false);
  assert.equal(
    isEraMediaPublic({ ...base, rightsEvidenceRef: "license:123" }),
    true
  );
  assert.equal(
    isEraMediaPublic({
      ...base,
      rightsState: "PENDING_VERIFICATION",
      rightsEvidenceRef: "pending:123",
    }),
    false
  );
});

test("Era media rejects insecure and expired public assets", () => {
  const now = new Date("2026-10-03T15:00:00Z");

  assert.equal(
    isEraMediaPublic(
      {
        mediaUrl: "http://cdn.example.com/hero.mp4",
        rightsState: "OWNED",
        rightsEvidenceRef: "owned:asset",
        status: "APPROVED",
      },
      now
    ),
    false
  );

  assert.equal(
    isEraMediaPublic(
      {
        mediaUrl: "https://cdn.example.com/hero.mp4",
        rightsState: "BRAND_AUTHORIZED",
        rightsEvidenceRef: "brand:license",
        rightsEndsAt: "2026-10-03T14:59:59Z",
        status: "APPROVED",
      },
      now
    ),
    false
  );
});

test("theme config selects only approved presets", () => {
  assert.equal(normalizeThemeTokens({ preset: "nocturne" }).motionProfile, "cinematic");
  assert.equal(normalizeThemeTokens({ preset: "cleanTech" }).motionProfile, "precision");

  const arbitrary = normalizeThemeTokens({
    preset: "javascript:alert(1)",
    accent: "url(evil)",
  });
  assert.equal(arbitrary.motionProfile, "organic");
  assert.equal(arbitrary.accent, "leaf");
});

test("Era section plan rejects unknown and duplicate sections", () => {
  assert.deepEqual(
    validateEraSections([
      { sectionType: "HERO", position: 0 },
      { sectionType: "PRODUCT_GRID", position: 1 },
    ]),
    { ok: true }
  );

  assert.equal(
    validateEraSections([{ sectionType: "RAW_HTML", position: 0 }]).ok,
    false
  );

  assert.equal(
    validateEraSections([
      { sectionType: "HERO", position: 0 },
      { sectionType: "PRODUCT_GRID", position: 0 },
    ]).ok,
    false
  );
});

test("public active Era honors visibility and schedule", () => {
  const now = new Date("2026-10-03T15:00:00Z");

  assert.equal(
    isPublicEra(
      {
        lifecycleState: "ACTIVE",
        visibility: "PUBLIC",
        startAt: "2026-10-03T14:00:00Z",
        endAt: "2026-10-04T15:00:00Z",
      },
      now
    ),
    true
  );

  assert.equal(
    isPublicEra(
      {
        lifecycleState: "ACTIVE",
        visibility: "PRIVATE",
      },
      now
    ),
    false
  );

  assert.equal(
    isPublicEra(
      {
        lifecycleState: "ACTIVE",
        visibility: "PUBLIC",
        startAt: "2026-10-04T15:00:00Z",
      },
      now
    ),
    false
  );
});

test("migration enforces single active primary Era and backend skeleton tables", async () => {
  const migration = await readFile(
    new URL("../drizzle/0011_era_engine_r0.sql", import.meta.url),
    "utf8"
  );

  for (const table of [
    "eras",
    "era_media_assets",
    "era_sections",
    "era_products",
    "era_watchtower_bindings",
    "era_events",
  ]) {
    assert.match(migration, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
  }

  assert.match(migration, /eras_single_active_primary_idx/);
  assert.match(migration, /WHERE is_primary = true AND lifecycle_state = 'ACTIVE'/);
});

test("public resolver fails closed on ambiguous current Era and returns no private economics", async () => {
  const source = await readFile(
    new URL("../src/lib/era-engine/resolver.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /AMBIGUOUS_ACTIVE_PRIMARY_ERA/);
  assert.match(source, /limit\(2\)/);
  assert.doesNotMatch(source, /product\.cost/);
  assert.doesNotMatch(source, /economics:/);
  assert.doesNotMatch(source, /watchtower_profile/);
});

test("north-star docs are durable and root README points successors to them", async () => {
  const [readme, startHere, blueprint, contract] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../ACRE_ERA_START_HERE.md", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../docs/ACRE_ERA_NORTH_STAR_SITE_MAP_AND_PAGE_BLUEPRINT_2026-10-03.md",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL(
        "../docs/ACRE_ERA_ERA_ENGINE_BACKEND_CONTRACT_R0_2026-10-03.md",
        import.meta.url
      ),
      "utf8"
    ),
  ]);

  assert.match(readme, /ACRE_ERA_START_HERE\.md/);
  assert.match(startHere, /mandatory successor orientation/i);
  assert.match(blueprint, /create Era data -> assign approved assets/i);
  assert.match(contract, /skeleton first/i);
});


test("admin Era creation is draft-only and cannot self-activate", async () => {
  const source = await readFile(
    new URL("../src/app/api/admin/eras/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /lifecycleState: "DRAFT"/);
  assert.match(source, /visibility: "PRIVATE"/);
  assert.match(source, /isPrimary: false/);
  assert.match(source, /authority: "DRAFT_ONLY"/);
  assert.doesNotMatch(source, /lifecycleState:\s*"ACTIVE"/);
  assert.doesNotMatch(source, /visibility:\s*"PUBLIC"/);
});


test("Era composition endpoints cannot activate publish or grant Watchtower ACT authority", async () => {
  const [media, sections, productsRoute, watchtower] = await Promise.all([
    readFile(new URL("../src/app/api/admin/eras/[id]/media/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/admin/eras/[id]/sections/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/admin/eras/[id]/products/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/admin/eras/[id]/watchtower/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(media, /status: "DRAFT"/);
  assert.match(media, /MEDIA_METADATA_DRAFT_ONLY/);
  assert.match(sections, /COMPOSE_ONLY_NO_ACTIVATION/);
  assert.match(productsRoute, /CURATION_ONLY/);
  assert.match(productsRoute, /does not publish the product/i);
  assert.match(watchtower, /READ_RECOMMEND_BINDING_ONLY/);
  assert.match(watchtower, /never enables or grants ACT authority/i);

  for (const source of [media, sections, productsRoute, watchtower]) {
    assert.doesNotMatch(source, /lifecycleState:\s*"ACTIVE"/);
    assert.doesNotMatch(source, /visibility:\s*"PUBLIC"/);
  }
});


test("Era readiness gate checks hero, public media, products, and affiliate authorization without activating", async () => {
  const [readiness, route] = await Promise.all([
    readFile(new URL("../src/lib/era-engine/readiness.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/admin/eras/[id]/readiness/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(readiness, /ERA_HERO_SECTION_MISSING/);
  assert.match(readiness, /ERA_PUBLIC_HERO_MEDIA_MISSING/);
  assert.match(readiness, /ERA_ACTIVE_PRODUCT_MISSING/);
  assert.match(readiness, /ERA_AFFILIATE_AUTHORIZATION_MISSING/);
  assert.match(readiness, /ERA_AFFILIATE_DESTINATION_MISSING/);
  assert.match(route, /READINESS_ONLY_NO_ACTIVATION/);
  assert.doesNotMatch(route, /\.update\(/);
  assert.doesNotMatch(route, /\.insert\(/);
});
