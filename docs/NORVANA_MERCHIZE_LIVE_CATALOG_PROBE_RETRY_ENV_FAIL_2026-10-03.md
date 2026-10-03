# Norvana Merchize Live Catalog Probe — Retry Environment Binding FAIL

Date: 2026-10-03

Branch:

`feature/2026-10-02-norvana-supplier-expansion-r0`

Retry one-shot probe commit:

`e141891f41a5c3338ca4219e820d882de5124e79`

Vercel Preview deployment:

`dpl_CU7tb8QgQZdRCi6a7F3EkefiXxLn`

Deployment result:

`ERROR`

Build result:

`Command "npm run build" exited with 34`

The controlled probe maps exit code `34` to:

`MERCHIZE_BUILD_PROBE=FAIL_BASE_URL_NOT_BOUND`

## Interpretation

The retry reproduced the prior environment-binding failure.

- exact Supplier Expansion Preview branch was reached;
- `NORVANA_MERCHIZE_ACCESS_TOKEN` was visible;
- `NORVANA_MERCHIZE_BASE_URL` was not visible under the expected exact key;
- no provider HTTP request ran;
- no order, payment, publishing, supplier activation, fulfillment, refund, or price action ran;
- no secret value was printed or committed.

The Preview deployment gate is refrozen after this receipt.
