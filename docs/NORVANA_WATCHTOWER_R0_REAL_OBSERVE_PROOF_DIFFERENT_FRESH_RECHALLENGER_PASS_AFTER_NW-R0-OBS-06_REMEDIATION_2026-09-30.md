# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER PASS AFTER NW-R0-OBS-06 REMEDIATION

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`DIFFERENT_FRESH_RECHALLENGER_PASS`

This disposition is bound only to the exact immutable remediation candidate below.

I did not build or repair this candidate. I did not deploy it, rerun the real observation proof, or self-certify Independent Assurance or closure.

## Exact immutable candidate challenged

Commit:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Parent:

`a739df30377c56a03214b1c5a14127375f0a3baa`

Tree:

`827f8a25ecd8d8f0844e2385f244df26ac1d4415`

GitHub's commit object independently confirms the exact parent and tree.

Compared with remediation activation head:

`2a217d0f7d48b36716a65260ec1d52e241cf205b`

the final candidate is exactly two commits ahead and changes only:

- `src/lib/browser-origin.ts`
- `src/lib/admin-guard.ts`
- `tests/watchtower-policy.test.ts`

The final fixup from failed intermediate candidate `a739df3...` to `44fe8b2...` changes only one stale test assertion.

## Required Recovery CI independently reconciled

Required run:

`36758702065 — SUCCESS`

Job:

`110035415122 — static-verification — SUCCESS`

The job log independently confirms exact checkout:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Watchtower tests:

`49 PASS / 0 FAIL`

The same run also completed:

- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

The production dependency audit reported zero vulnerabilities. The full dependency audit retained four moderate development-tool findings and did not trip the configured high-severity gate.

## Re-challenge of NW-R0-OBS-06

Preserved finding under re-challenge:

`NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`

The exact candidate survives the re-challenge.

### 1. Full request-origin comparison is now shared by read and mutation guards

Both authenticated browser boundaries call the shared origin evaluators with:

`requestOrigin: req.nextUrl.origin`

The former Host-only comparison is absent.

The expected origin parser requires a canonical HTTP(S) origin with no credentials, path beyond `/`, query, or fragment.

### 2. Origin is validated as a canonical serialized web origin

The explicit Origin parser:

- rejects missing/invalid serialization;
- rejects `Origin: null`;
- rejects non-HTTP(S) schemes;
- rejects userinfo;
- rejects path/query/fragment-bearing values because the parsed `.origin` must equal the complete raw value;
- rejects non-canonical spellings, including explicit default-port spellings normalized away by the URL parser;
- compares the complete canonical origin tuple, including scheme and effective port.

Same-host HTTP Origin against an HTTPS request origin is rejected.

Exact non-default ports match only when both request origin and Origin contain the same effective port.

### 3. Referer is handled as a URL whose parsed origin must match

Referer may contain a normal path/query.

Its parsed `.origin` must equal the expected request origin.

Malformed, non-HTTP(S), credential-bearing, or cross-origin Referer values fail closed.

### 4. Contradictory provenance cannot override origin policy

Supplemental provenance validation rejects any supplied `Sec-Fetch-Site` value other than `same-origin`.

A mismatched or malformed Referer is independently rejected.

Therefore:

- `Sec-Fetch-Site: same-origin` cannot override an attacker Referer;
- same-origin Referer cannot override `same-site` or `cross-site`;
- a valid same-origin Origin cannot override contradictory Fetch Metadata or Referer.

### 5. Safe-read and mutation semantics remain distinct

Authenticated safe read permits only `GET` and `HEAD`.

With Origin absent, safe read requires at least one accepted same-origin provenance signal and rejects any supplied contradictory signal.

Origin-less unsafe methods are rejected.

The strict mutation guard still requires an explicit valid same-origin Origin.

### 6. Server-admin-token behavior is unchanged

`requireCurrentRecoveryAdmin` and `requireCurrentRecoveryAdminRead` still first accept the configured `x-norvana-admin-token` path using the same constant-time equality behavior.

Only authenticated browser-session handling is routed through the browser-origin evaluators.

### 7. Route separation remains preserved

Exact-candidate route review confirms:

- `GET /api/watchtower/jobs` uses `requireCurrentRecoveryAdminRead(req)`;
- `POST /api/watchtower/jobs` uses `requireCurrentRecoveryAdmin(req)`;
- `PATCH /api/watchtower/jobs/{id}` uses `requireCurrentRecoveryAdmin(req)`;
- other consequential Watchtower admin routes inspected remain on the strict mutation guard or their dedicated worker/cron/OIDC boundary;
- the NW-R0-OBS-06 remediation changed no route file.

No consequential route was widened by this remediation.

## Additional independent adversarial semantic probes

A separate local semantic harness reproducing the exact candidate evaluator logic exercised 23 required/adversarial cases.

Result:

`23 PASS / 0 FAIL`

The probes included:

- same-host cross-scheme Origin;
- path/query/fragment Origin;
- URL userinfo;
- `Origin: null`;
- FTP Origin;
- explicit default-port non-canonical Origin;
- exact non-default-port match and mismatch;
- path-bearing same-origin Referer;
- malformed and non-HTTP(S) Referer;
- contradictory Fetch Metadata + Referer;
- explicit valid Origin + contradictory Fetch Metadata;
- origin-less GET with and without accepted provenance;
- origin-less unsafe method;
- strict mutation missing Origin;
- strict mutation conflicting Referer and Fetch Metadata.

No material bypass was reproduced.

## Preserved NW-R0-OBS-02 through NW-R0-OBS-05 hardening

### NW-R0-OBS-02 — redirect validation

`scripts/watchtower-observe-proof-fetch.mjs` still uses:

`redirect: "manual"`

Every redirect target is validated before a request is issued to the next hop.

Redirect depth remains bounded and unsupported redirect behavior fails closed.

### NW-R0-OBS-03 — source-controlled destination binding

`scripts/watchtower-observe-proof-destination.mjs` remains the source-controlled destination authority.

The exact candidate remains intentionally fail-closed at:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

The destination validator still requires HTTPS, no credentials, no custom port, an approved Norvana Preview hostname shape, and origin-only syntax.

The worker imports this source-controlled helper and does not accept an arbitrary runtime base URL.

### NW-R0-OBS-04 — no-OIDC preflight

The observe-proof workflow keeps a distinct `preflight` job with only `contents: read`.

Exact confirmation validation and destination validation occur there before the OIDC-capable job.

The OIDC-capable job declares `needs: preflight`, receives `id-token: write` only in that job, and checks out exact `${{ github.sha }}`.

The destination is revalidated from that exact SHA before the proof worker runs.

### NW-R0-OBS-05 — safe-read route split

The authenticated safe-read boundary remains limited to the jobs snapshot GET route.

Strict mutation semantics remain in force for POST/PATCH and other owner mutations.

## Current-runtime, cardinality, and zero-effect controls

Static review confirms the exact candidate still preserves:

- current-runtime proof requirements;
- shared advisory transaction locks;
- Local Producer Watch as the exact observe-proof target;
- OBSERVE-only authority for the real-observe proof;
- exact zero budget;
- all other watchers PAUSED;
- exactly-one active/executable OBSERVE_PROOF invariants;
- dedicated GitHub OIDC observe-proof authentication;
- zero candidate emission;
- zero estimated cost;
- normal scheduler/executor locks;
- external fulfillment lock;
- supplier connector lock;
- IgniAqua federation lock;
- ACT/consequential-action ceiling.

The NW-R0-OBS-06 remediation changed none of those implementation files.

## Deployment state independently reconciled

Repository state remains:

`vercel.json -> git.deploymentEnabled=false`

Live Vercel inventory independently shows no deployment for:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

The newest recovery-branch Preview remains:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

from commit:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

That historical failed Preview is not proof of this candidate and was not reused.

No deployment or real observation proof was performed in this Re-Challenger role.

## Preserved failed intermediate candidate

Failed intermediate candidate:

`a739df30377c56a03214b1c5a14127375f0a3baa`

Tree:

`84f820acab1224a4db0ab325a35e41a620d1359e`

Recovery CI:

`36758597695 — FAIL`

The failed run preserved the expected 48/49-stage failure caused by a stale assertion expecting `NORVANA_SAME_ORIGIN_REQUIRED` while the hardened evaluator correctly returned `NORVANA_CROSS_ORIGIN_REJECTED`.

The final candidate changed only that assertion.

## Preserved original NW-R0-OBS-06 failure

Original failed candidate:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Fresh Challenger FAIL report commit:

`56e2e8a750564c624f6d9a8db0580a853069d10e`

PR #1 failure receipt:

`5914937102`

That failure lineage remains intact.

## Final disposition

`DIFFERENT_FRESH_RECHALLENGER_PASS`

No material defect was found in the exact immutable remediation candidate.

This PASS does not authorize deployment or execution of the real observation proof and does not self-certify Independent Assurance or closure.

It permits progression only to a separate Controlled Live-Proof Operator that must create a new exact Preview and a new exact main destination pin before any real-observe execution.
