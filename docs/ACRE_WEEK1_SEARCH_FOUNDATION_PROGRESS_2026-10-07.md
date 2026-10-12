# ACRE FOUNDATION WEEK 1 — SEARCH FOUNDATION PROGRESS RECEIPT

Date: 2026-10-07
Mission: ACRE-FOUNDATION-001
Status: IMPLEMENTED / VALIDATION PENDING
Exact head after this pass: cdd6328d04ba550de0f435188950a4ca5f506014

## Completed in this pass

- Added src/app/robots.ts
  - public crawl allowed;
  - /admin/ and /watchtower disallowed;
  - sitemap declared at https://acreera.com/sitemap.xml;
  - host declared as https://acreera.com.

- Added src/app/sitemap.ts
  - /;
  - /market;
  - /shop;
  - /partners;
  - /era-drops;
  - /growers;
  - /archive.
  - No private Watchtower/admin routes included.

- Added src/app/manifest.ts
  - Acre Era name and short name;
  - standalone display;
  - existing Cream/Soil theme colors;
  - shopping/lifestyle categories.
  - Brand icon assets intentionally deferred until the production monogram is finalized.

- Strengthened root metadata
  - metadataBase = https://acreera.com;
  - title template;
  - shared description;
  - Open Graph baseline;
  - Twitter card baseline.
  - Existing Impact verification tag preserved.

- Added route metadata and canonical paths for:
  - /market;
  - /shop;
  - /partners;
  - /era-drops;
  - /growers.

## Important indexing behavior

The public apex acreera.com is intended for indexing.

The preview hostname has previously been observed returning Vercel x-robots-tag: noindex while the apex did not. Do not add a build-time VERCEL_ENV noindex rule globally because acreera.com is currently aliased to the controlled branch deployment and could inherit a false preview noindex policy.

Verify host-specific behavior after deployment.

## Not completed yet

- final favicon/icon;
- final Open Graph artwork;
- social profile imagery;
- Organization structured data;
- Search Console verification/submission;
- route metadata for additional future evergreen pages;
- production identity replacement in navbar.

These wait on final Concept A production identity or a later bounded pass.

## Validation truth

At receipt creation, no GitHub workflow run had registered for exact head:
cdd6328d04ba550de0f435188950a4ca5f506014

Do not call this pass CI-PASS until exact-head validation completes.

## Next safe action

1. validate exact head;
2. remediate any compile/type failures if found;
3. continue Concept A production identity;
4. produce favicon/social/avatar assets from accepted mark;
5. deploy only through controlled Acre Era workflow;
6. verify robots, sitemap, metadata, and host-specific indexing behavior live.
