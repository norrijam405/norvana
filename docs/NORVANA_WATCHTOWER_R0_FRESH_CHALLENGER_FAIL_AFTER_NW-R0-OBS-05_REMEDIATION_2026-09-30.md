# NORVANA WATCHTOWER R0 — FRESH CHALLENGER FAIL AFTER NW-R0-OBS-05 REMEDIATION

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`FRESH_CHALLENGER_FAIL`

This report is produced by a separate Fresh Challenger.

This challenger did not build the candidate, did not repair the defect, did not deploy or rerun the real observation proof, and does not self-certify Independent Assurance or closure.

## Exact immutable candidate challenged

Commit:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Parent:

`dbe881e9de3db6afc108e9eee3dca8c624800ba6`

Tree:

`c2d4e94a401b80e9adad8c9db7a9a52c1cdf9378`

Required Recovery CI:

`36735040684 — SUCCESS`

Job:

`109954409448 — static-verification — SUCCESS`

Exact checkout independently reconciled from the job log:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Watchtower suite:

`43 PASS / 0 FAIL`

Green CI is not sufficient for this disposition because the adversarial origin cases below are not covered by the 43-test suite.

## Preserved predecessor finding

`NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`

The remediation does fix the narrow live failure path for a normal authenticated same-origin GET with no Origin when `Sec-Fetch-Site: same-origin` or an exact-host Referer is accepted.

However, the candidate does not correctly implement full same-origin semantics.

## New material finding

`NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`

### Root cause

The new safe-read evaluator reduces an Origin URL to:

`url.host.toLowerCase()`

and compares only that host value with the request host.

The retained strict mutation guard likewise parses Origin with `new URL(origin)` and compares only:

`originUrl.host !== host`

Neither guard compares the full web origin tuple (scheme, host, port), and neither validates that the Origin header is a valid serialized origin with no path/query/fragment/userinfo.

### Independently reproduced failing cases

Using the exact evaluator semantics from the immutable candidate and the controlled Preview host:

`norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

the following requests are accepted when they must fail closed.

#### Case A — same host, different scheme

Input:

- method: `GET`
- Origin: `http://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`
- Host: `norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`
- Sec-Fetch-Site: `cross-site`

Actual safe-read evaluator result:

`{ ok: true }`

This is not same-origin with the HTTPS deployment. Scheme is part of the web origin.

The retained strict mutation guard has the same host-only comparison and also passes the same cross-scheme Origin instead of rejecting it.

#### Case B — malformed/non-serialized Origin containing a path

Input:

- method: `GET`
- Origin: `https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin`
- Host: `norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

Actual safe-read evaluator result:

`{ ok: true }`

The value parses as a URL, but it is not a valid serialized Origin header value. The path is silently discarded by `url.host`, so malformed Origin syntax is accepted rather than rejected.

The retained strict mutation guard likewise accepts this malformed value because it also checks only `originUrl.host`.

#### Case C — contradictory Fetch Metadata and Referer

Input:

- method: `GET`
- Origin: absent
- Host: controlled Preview host
- `Sec-Fetch-Site: same-origin`
- Referer: `https://attacker.example/`

Actual safe-read evaluator result:

`{ ok: true }`

The evaluator returns on `Sec-Fetch-Site: same-origin` before examining the contradictory Referer. The activation explicitly required mismatched Referer and Fetch Metadata ambiguity to fail safely.

### Why this is material

The challenge required proof of:

- authenticated safe-read same-origin semantics;
- same-site-but-not-same-origin rejection;
- malformed Origin/Referer handling;
- mismatched Referer rejection;
- unsafe-method rejection;
- retention of a strict mutation same-origin boundary.

The candidate fails those semantics at the origin-validation boundary itself.

The finding is therefore material even though normal same-origin browser GET behavior is now admitted and CI remains green.

## Route separation

The structural route split is preserved:

- `GET /api/watchtower/jobs` uses `requireCurrentRecoveryAdminRead(req)`.
- `POST /api/watchtower/jobs` uses `requireCurrentRecoveryAdmin(req)`.
- `PATCH /api/watchtower/jobs/{id}` uses `requireCurrentRecoveryAdmin(req)`.
- the PATCH route does not import or use the read guard.

No finding was observed that the new read guard was wired directly into a mutation route.

The FAIL is semantic: the origin checks used by the read guard, and the retained mutation guard, are not actually strict same-origin checks.

## Preserved prior hardening independently reconciled

The immutable candidate still preserves the previously challenged controls:

- NW-R0-OBS-02 manual redirect handling remains `redirect: "manual"` with approval of each next hop before requesting it;
- NW-R0-OBS-03 source-controlled destination binding remains fail closed at `__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`;
- NW-R0-OBS-04 keeps confirmation validation in a no-OIDC preflight before the OIDC-capable proof job;
- both workflow jobs bind checkout to exact `${{ github.sha }}`;
- the OIDC-capable job still requires the preflight job;
- the queue path still requires current-runtime Control Proof and Worker Proof markers;
- the claim path still uses the dedicated observe-proof OIDC worker guard;
- the result path still enforces zero candidate emission / zero estimated cost effects;
- the worker remains bound to the source-controlled destination helper;
- Local Producer Watch OBSERVE/$0 restrictions and watcher/run cardinality checks remain present;
- normal queue/executor, fulfillment, supplier connectors, federation, ACT and consequential commerce authority remain locked by the existing proof policy/tests;
- `vercel.json -> git.deploymentEnabled=false` remains present.

## Deployment reconciliation

Live Vercel project state was independently inspected.

No deployment was found for remediation candidate:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

The latest recovery Preview remains the historical failed controlled deployment:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

with source commit:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

That Preview is not proof of this remediation and was not reused.

No deployment or real observation proof was performed by this Fresh Challenger.

## Required next gate

A separate Remediation Builder must address `NW-R0-OBS-06` and produce a new immutable candidate.

At minimum, remediation must prove full origin semantics rather than host-only equivalence, reject malformed/non-serialized Origin values, fail closed on contradictory browser provenance signals, preserve server-token behavior, and keep POST/PATCH and all consequential routes on a strict mutation boundary.

This Fresh Challenger does not repair the defect.

## Final disposition

`FRESH_CHALLENGER_FAIL`
