# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER PASS AFTER NW-R0-OBS-05

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to remediation of:

`NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`

The controlled live-proof failure remains preserved in:

`docs/NORVANA_WATCHTOWER_R0_CONTROLLED_REAL_OBSERVE_LIVE_PROOF_FAIL_NW-R0-OBS-05_2026-09-30.md`

Failure report commit:

`9779d663ab56dd994763e4b83f20ee126b07add1`

Remediation activation commit:

`dbe881e9de3db6afc108e9eee3dca8c624800ba6`

PR #1 failure receipt:

`5910324416`

The Builder did not deploy this remediation candidate, did not rerun the real observation proof, and did not self-certify Fresh Challenger or Independent Assurance.

## Exact immutable remediation candidate

Commit:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Parent:

`dbe881e9de3db6afc108e9eee3dca8c624800ba6`

Tree:

`c2d4e94a401b80e9adad8c9db7a9a52c1cdf9378`

Recovery CI:

`36735040684 — SUCCESS`

Watchtower tests:

`43 PASS / 0 FAIL`

Also PASS:
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Exact executable delta

Relative to the Remediation Builder activation head, the exact candidate changes only:

- `src/lib/browser-origin.ts` — new pure safe-read browser-origin evaluator;
- `src/lib/admin-guard.ts` — adds a dedicated authenticated safe-read guard while preserving the existing strict mutation guard;
- `src/app/api/watchtower/jobs/route.ts` — only GET switches to the dedicated read guard; POST remains on the strict mutation guard;
- `tests/watchtower-policy.test.ts` — adds executable browser-header and route-boundary regression tests.

No Watchtower queue, claim, finalization, worker, scheduler, commerce, supplier, fulfillment, payment, publication, repricing, refund, or federation implementation was widened.

## Remediation architecture

The prior defect came from using one strict browser mutation-origin guard for both safe reads and consequential mutations.

The remediation separates those boundaries.

### Strict mutation guard remains unchanged

`requireCurrentRecoveryAdmin(req)`

continues to require the existing strict browser same-origin `Origin` check for authenticated browser mutations.

Consequential routes such as:
- `POST /api/watchtower/jobs`;
- `PATCH /api/watchtower/jobs/{id}`;

remain on the strict mutation guard.

No mutation route was switched to the safe-read guard.

### New authenticated safe-read guard

`requireCurrentRecoveryAdminRead(req)`

still requires valid recovery-admin authentication.

For an authenticated browser session it calls:

`requireBrowserSameOriginRead(req)`

which uses the pure evaluator:

`evaluateAuthenticatedBrowserReadOrigin(...)`

If a browser sends `Origin`, it must exactly match the request host.

If `Origin` is absent, only safe methods:

- `GET`
- `HEAD`

may proceed, and only when normal browser same-origin evidence is present:

- `Sec-Fetch-Site: same-origin`; or
- an exact same-origin `Referer` fallback.

Cross-site and explicit cross-origin requests fail closed.

Origin-less POST/mutation attempts fail closed.

## Exact route remediation

Only:

`GET /api/watchtower/jobs`

now uses:

`requireCurrentRecoveryAdminRead(req)`

The same module's POST remains:

`requireCurrentRecoveryAdmin(req)`

and:

`PATCH /api/watchtower/jobs/{id}`

also remains on:

`requireCurrentRecoveryAdmin(req)`

This permits the exact safe founder job snapshot that failed during controlled live proof without weakening the consequential mutation boundary.

## Adversarial regression coverage

The 43-test suite now proves:

1. The exact live browser semantic works:
   - authenticated safe GET;
   - no `Origin`;
   - same Preview host;
   - `Sec-Fetch-Site: same-origin`;
   - result PASS.

2. A same-origin `Referer` can safely serve as fallback when `Origin` and Fetch Metadata are absent.

3. A cross-site GET with attacker Referer and `Sec-Fetch-Site: cross-site` is rejected.

4. An explicit attacker `Origin` is rejected even when other headers appear same-origin.

5. An origin-less POST is rejected even if same-origin Fetch Metadata and Referer are present.

6. Static route-boundary tests prove:
   - jobs GET uses only the read guard;
   - jobs POST retains the strict mutation guard;
   - jobs PATCH retains the strict mutation guard;
   - the read guard is not imported into the PATCH route.

## Preserved prior hardening

This candidate preserves:
- NW-R0-OBS-02 manual per-hop redirect validation;
- NW-R0-OBS-03 source-controlled OIDC destination binding;
- NW-R0-OBS-04 no-OIDC preflight and inert confirmation handling;
- current-runtime Control Proof and Worker Proof requirements;
- exact Local Producer Watch target;
- OBSERVE-only authority;
- exact $0 budget;
- all other watchers PAUSED invariant;
- exactly-one OBSERVE_PROOF invariant;
- zero candidate emission;
- zero estimated cost;
- dedicated GitHub OIDC claim verification;
- normal scheduler OFF;
- normal executor OFF;
- fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- ACT locked.

## Deployment state

Recovery remains:

`git.deploymentEnabled=false`

No Vercel deployment exists for remediation candidate:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

The most recent recovery Preview remains the failed controlled-live candidate deployment:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

from source:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

That Preview must not be reused as proof of this remediation.

The previous main observe-proof destination pin also points to that failed Preview and must not be reused for a future live proof. A later separate controlled operator must deploy the challenged remediation candidate and repin main to the exact new Preview origin.

## Next gate

A genuinely separate Fresh Challenger must independently challenge exact immutable candidate:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Do not deploy or rerun the controlled real-observe proof before that challenge.
