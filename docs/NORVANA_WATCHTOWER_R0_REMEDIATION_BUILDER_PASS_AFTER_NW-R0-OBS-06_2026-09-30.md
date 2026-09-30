# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER PASS AFTER NW-R0-OBS-06

Date: 2026-09-30

Repository: `norrijam405/norvana`
Pull Request: `#1`
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to remediation of:

`NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`

The Fresh Challenger FAIL is preserved in:

`docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_AFTER_NW-R0-OBS-05_REMEDIATION_2026-09-30.md`

Failure report commit:

`56e2e8a750564c624f6d9a8db0580a853069d10e`

PR #1 failure receipt:

`5914937102`

The Builder did not deploy this candidate, did not rerun the real observation proof, and did not self-certify Fresh Challenger, Re-Challenger, Independent Assurance, or closure.

## Exact immutable remediation candidate

Commit:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Parent:

`a739df30377c56a03214b1c5a14127375f0a3baa`

Tree:

`827f8a25ecd8d8f0844e2385f244df26ac1d4415`

Recovery CI:

`36758702065 — SUCCESS`

Job:

`110035415122 — static-verification — SUCCESS`

Watchtower tests:

`49 PASS / 0 FAIL`

Also PASS:
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Preserved failed intermediate candidate

Commit:

`a739df30377c56a03214b1c5a14127375f0a3baa`

Tree:

`84f820acab1224a4db0ab325a35e41a620d1359e`

Recovery CI:

`36758597695 — FAIL`

Disposition:
- 48/49 Watchtower tests passed;
- the only failure was an older cross-site assertion expecting `NORVANA_SAME_ORIGIN_REQUIRED`;
- the hardened evaluator correctly returned `NORVANA_CROSS_ORIGIN_REJECTED`;
- the failed candidate remains preserved.

## Executable delta from Builder activation

Compared with activation head `2a217d0f7d48b36716a65260ec1d52e241cf205b`, the final candidate changes only:

- `src/lib/browser-origin.ts`
- `src/lib/admin-guard.ts`
- `tests/watchtower-policy.test.ts`

No Watchtower queue, claim, result, scheduler, worker, payment, supplier, fulfillment, publication, repricing, refund, or federation implementation was widened.

## Remediation architecture

The read and mutation browser boundaries now share full web-origin semantics.

### Expected origin

Both guards compare against:

`req.nextUrl.origin`

rather than reducing the request boundary to Host alone.

The expected origin must be a canonical HTTP(S) origin.

### Serialized Origin validation

An explicit Origin header must be a canonical serialized HTTP(S) origin.

The evaluator rejects:
- `Origin: null`;
- same-host cross-scheme values;
- path-bearing Origin values;
- query-bearing Origin values;
- fragment-bearing Origin values;
- URL userinfo;
- malformed URLs;
- non-HTTP(S) schemes;
- non-canonical origin spellings.

The complete origin tuple, including scheme, host, and effective port, must equal the expected request origin.

### Referer validation

Referer may contain a path, as normal browser Referer values do, but its parsed `.origin` must equal the expected request origin.

Malformed Referer values fail closed.

### Provenance-signal agreement

When multiple browser provenance signals are supplied, all supplied signals must agree.

In particular:
- `Sec-Fetch-Site: same-origin` cannot override an attacker Referer;
- a same-origin Referer cannot override `Sec-Fetch-Site: same-site` or `cross-site`;
- a valid same-origin Origin cannot override contradictory Fetch Metadata or Referer.

### Safe-read boundary

The authenticated safe-read evaluator permits only:
- `GET`
- `HEAD`

If Origin is absent, at least one same-origin browser provenance signal must be present:
- `Sec-Fetch-Site: same-origin`; or
- same-origin Referer.

Any supplied contradictory signal causes rejection.

### Mutation boundary

The strict mutation guard requires an explicit canonical same-origin Origin.

It also fails closed if supplied Fetch Metadata or Referer contradict that Origin.

The server-admin-token path is unchanged.

## Adversarial regression coverage

The 49-test suite now includes coverage for:
- same-host HTTP Origin against HTTPS request origin;
- path/query/fragment-bearing Origin values;
- `Origin: null`;
- URL userinfo;
- exact non-default port matching and port mismatch;
- contradictory `Sec-Fetch-Site` and Referer;
- same-site-but-different-origin browser provenance;
- malformed Referer;
- origin-less safe read with no provenance;
- origin-less unsafe method;
- exact request-origin use in the admin guard;
- structural preservation of safe GET vs strict POST/PATCH route separation.

## Preserved prior hardening

The candidate preserves:
- NW-R0-OBS-02 manual per-hop redirect validation;
- NW-R0-OBS-03 source-controlled OIDC destination binding;
- NW-R0-OBS-04 no-OIDC preflight and inert confirmation handling;
- NW-R0-OBS-05 dedicated authenticated safe-read route split;
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

No Vercel deployment exists for:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

The latest recovery Preview remains the historical failed controlled deployment:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

from:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

That Preview and the old main destination pin must not be reused as proof of this remediation.

## Next gate

A genuinely different Fresh Re-Challenger must independently challenge exact immutable candidate:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Do not deploy or rerun the controlled real-observe proof before that challenge.
