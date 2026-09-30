# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER PASS AFTER NW-R0-OBS-02

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REMEDIATION_BUILDER_PASS`

This disposition applies only to remediation of:

`NW-R0-OBS-02 — OBSERVE_PROOF_REDIRECT_CHAIN_VALIDATES_ONLY_FINAL_HOST`

The Fresh Challenger FAIL is preserved on PR #1 as comment `5903888375`.

The prior Watchtower Independent Assurance PASS remains preserved and is not rewritten.

The Builder did not deploy this candidate, did not execute the real observation proof, and did not self-certify Fresh Challenger, Re-Challenger, or Independent Assurance.

## Exact immutable remediation candidate

Commit:

`42674b7682be919b326aba0d7b72d5b3a4df76ef`

Parent:

`74852a99551dc1623eb83253cfb6d5d2b16676c6`

Tree:

`7a887cb65f54da9809e1e81f148e9d871bff7bc0`

Required Recovery CI:

`36669458901 — SUCCESS`

Watchtower tests:

`31 PASS / 0 FAIL`

Also PASS:
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Exact remediation

The automatic Fetch redirect path was removed from real-observe public-source retrieval.

New helper:

`scripts/watchtower-observe-proof-fetch.mjs`

The worker now calls:

`fetchApprovedObserveProofHtml(...)`

instead of using `redirect: "follow"`.

### Per-hop network boundary

Every URL is validated before a request is sent.

Every redirect response is handled with:

`redirect: "manual"`

The next `Location` target is resolved relative to the current approved URL, then validated **before** any request is made to that target.

Allowed protocol:

`https:`

Allowed hosts:

- `ag.ok.gov`
- `ams.usda.gov`
- `www.ams.usda.gov`

The helper additionally rejects:
- URL-embedded credentials;
- non-HTTPS URLs;
- unapproved hosts;
- non-default ports other than explicit `443`;
- missing redirect `Location`;
- invalid redirect `Location`;
- unsupported 3xx statuses;
- implicit URL changes not represented by a validated manual redirect hop;
- excessive redirect chains.

Maximum redirects:

`5`

### Adversarial regression proof

The test suite now includes an executable multi-hop adversarial case:

approved host -> unapproved host -> approved host

The test records all requested URLs and proves the unapproved intermediate host is rejected **before it is requested**.

The resulting call list contains only the initial approved URL.

Additional regression tests prove:
- approved HTTPS redirect chains may complete;
- relative redirect locations are resolved and validated;
- redirect depth fails closed when the cap is exceeded.

## Preserved invariants

The remediation does not weaken:
- current-runtime Control Proof requirements;
- current-runtime Worker Proof requirements;
- exactly-one enabled watcher requirement;
- exact `local-producer-watch` target;
- exact `OBSERVE` authority;
- exact $0 budget;
- PAUSED state for all other watchers;
- exactly-one active `OBSERVE_PROOF`;
- no concurrent executable run requirement;
- dedicated GitHub OIDC proof-worker identity;
- zero candidate emission;
- zero estimated cost;
- consequential-action locks;
- normal scheduler lock;
- normal executor lock;
- fulfillment lock;
- supplier connector lock;
- IgniAqua federation lock.

No spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, ACT authority, or federation authority was added.

## Deployment state

`vercel.json` remains:

`git.deploymentEnabled=false`

Vercel reconciliation after the remediation confirms no deployment exists for `42674b7682be919b326aba0d7b72d5b3a4df76ef`.

The latest Watchtower recovery Preview remains:

`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

sourced from:

`dda91d79196a3ae0087e4ac135197eabb780bc75`

Therefore no real-observe execution has occurred against this remediation candidate.

## Next gate

A genuinely different Fresh Re-Challenger must independently challenge exact immutable candidate:

`42674b7682be919b326aba0d7b72d5b3a4df76ef`

The Builder role ends here.
