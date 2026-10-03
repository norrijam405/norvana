# Norvana Merchize Live Catalog Probe — Environment Binding FAIL

Date: 2026-10-03

Branch:

`feature/2026-10-02-norvana-supplier-expansion-r0`

One-shot probe commit:

`960b77281fa7ec3110bba7fcc4b207242d159489`

Vercel Preview deployment:

`dpl_2JETkFsyRxaKAaRN3NpuguZBLhqx`

Deployment state:

`ERROR`

Vercel build result:

`Command "npm run build" exited with 34`

The one-shot probe script maps exit code `34` to:

`MERCHIZE_BUILD_PROBE=FAIL_BASE_URL_NOT_BOUND`

## Preserved interpretation

- the exact Preview branch was reached;
- `NORVANA_MERCHIZE_ACCESS_TOKEN` was present, because the script checks that first and would exit `33` if it were absent;
- `NORVANA_MERCHIZE_BASE_URL` was not visible to this Preview build under the expected exact key;
- no Merchize network request ran after the missing Base URL gate;
- no order, payment, product publication, supplier activation, or fulfillment action ran;
- no credential value was printed or persisted.

## Required founder-side correction

In Vercel project `norvana`, ensure the exact variable:

`NORVANA_MERCHIZE_BASE_URL`

is saved to **Preview** and scoped to:

`feature/2026-10-02-norvana-supplier-expansion-r0`

The value must be the Base URL shown inside Merchize **Integrations -> API**.

Do not paste the value into GitHub or ChatGPT.

After correction, reopen a new one-shot Preview proof gate. Do not reuse this failed candidate as proof of API connectivity.
