# Acre Era Marketplace R0 — CI Toolchain Audit Note

Date: 2026-10-02

Initial Acre Era CI run:

`37095434151`

## Passed gates

- dependency install;
- Customer Voice regressions: 7/7 PASS;
- Acre Era marketplace regressions: 5/5 PASS;
- TypeScript;
- scoped ESLint;
- Next.js production build;
- runtime dependency audit with `--omit=dev`: **0 vulnerabilities**.

## Preserved development-toolchain advisories

The full dependency-tree audit reported high-severity `braces` findings through the development-only Next.js ESLint dependency chain and moderate `esbuild` findings through the development-only `drizzle-kit` tooling chain.

The npm-proposed `--force` fix would install breaking/downgraded tool versions, including an older `eslint-config-next` and older `drizzle-kit`.

This product/design lane does not force those breaking toolchain changes.

CI therefore keeps:

1. a **blocking production/runtime audit** with `npm audit --omit=dev --audit-level=high`;
2. a **visible non-blocking full-tree advisory step** so the development-toolchain debt is not hidden.

This is not a claim that the development advisories are remediated. It is a scope distinction between shipped runtime dependencies and build/lint/migration tooling.

No supplier execution authority is changed by this decision.
