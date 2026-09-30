# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF DIFFERENT FRESH RE-CHALLENGER FAIL AFTER NW-R0-OBS-03 REMEDIATION

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

This disposition is bound only to the exact immutable remediation candidate below.

I did not build this remediation candidate. I did not repair the defect found in this role. I did not deploy the candidate, execute the real observation proof, or self-certify closure.

## Exact immutable candidate challenged

Commit:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

Parent:

`e26da0b3886c6a690c2cc2915322b55da1cb8f11`

Tree declared by the activation and Builder receipt:

`8bb00e193e5330e71c38db552c01ad0096a8a99b`

GitHub compare independently confirms that the candidate is exactly one commit ahead of the declared parent and changes only:

- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof-destination.mjs`
- `scripts/watchtower-observe-proof.mjs`
- `tests/watchtower-policy.test.ts`

Required Recovery CI:

`36672087507 — SUCCESS`

Job:

`109749067318 — static-verification — SUCCESS`

The job log independently confirms checkout of exact commit:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

and Watchtower tests:

`35 PASS / 0 FAIL`

The same run completed typecheck, lint, production build, dependency checks, and the current-tree secret-regression gate.

## Re-challenge of NW-R0-OBS-03

The source-controlled destination remediation itself is present:

- the worker no longer reads its base URL from `process.env`;
- the checked-in destination is `__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`;
- the destination helper fails closed on that sentinel;
- the worker and pre-mint gate use the same checked-in destination helper;
- the validator requires HTTPS, rejects URL credentials, rejects non-default ports, rejects attacker/suffix-confusion hosts, and constrains the normalized hostname to the Norvana Vercel Preview host shape;
- the prior NW-R0-OBS-02 manual per-hop redirect validation remains present.

A no-network parser probe also exercised attacker suffixes, HTTP, userinfo, alternate ports, trailing-dot forms, percent-encoded host separators, Unicode-dot normalization, punycode/confusable hostnames, IPv4/IPv6, backslash ambiguity, path/query/fragment forms, and malformed URLs. Inputs that survived normalization resolved to the same approved HTTPS origin; no attacker origin escaped the hostname boundary.

However, the exact workflow contains a separate pre-validation code-execution path that defeats the required pre-OIDC-mint ordering.

## Preserved material finding

`NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`

### Vulnerable exact candidate code

`.github/workflows/watchtower-observe-proof.yml` contains:

```yaml
permissions:
  contents: read
  id-token: write
```

and later:

```yaml
- name: Verify explicit gate and source-pinned Preview destination
  shell: bash
  run: |
    set -euo pipefail
    test "${{ inputs.confirmation }}" = "RUN_LOCAL_PRODUCER_OBSERVE_PROOF"
    node scripts/watchtower-observe-proof-destination.mjs
```

The manually supplied `workflow_dispatch` string is interpolated directly into the temporary Bash script before the shell executes it.

GitHub's own Actions security documentation describes this exact class of risk: expression values substituted directly into a `run` script can become shell code. GitHub recommends treating such context-derived values as untrusted input and avoiding direct interpolation into executable scripts.

References:

- https://docs.github.com/en/actions/concepts/security/script-injections
- https://docs.github.com/en/actions/reference/security/oidc

### No-network adversarial reproduction

The following confirmation value is sufficient to break out of the quoted argument:

```text
RUN_LOCAL_PRODUCER_OBSERVE_PROOF" ; printf "PRE_VALIDATION_CODE_EXECUTED\n" ; #
```

After GitHub expression substitution, the vulnerable line is equivalent to:

```bash
test "RUN_LOCAL_PRODUCER_OBSERVE_PROOF" ; printf "PRE_VALIDATION_CODE_EXECUTED\n" ; #" = "RUN_LOCAL_PRODUCER_OBSERVE_PROOF"
```

`test "RUN_LOCAL_PRODUCER_OBSERVE_PROOF"` succeeds because the string is non-empty, so the injected command executes before:

```bash
node scripts/watchtower-observe-proof-destination.mjs
```

A local Bash reproduction with no network access confirmed that the injected command executes before the destination validator position.

No GitHub OIDC token was requested in the reproduction and no external endpoint was contacted.

### Why this defeats the remediation boundary

The same job grants `id-token: write`.

GitHub documents that this permission enables an action or step to request the OIDC JWT using `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN`.

Therefore arbitrary shell code injected through `inputs.confirmation` can execute in the privileged job before the checked-in destination validator runs and can invoke the GitHub OIDC request endpoint while the source destination is still:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

This disproves the required properties that:

- the UNPINNED candidate must fail before OIDC mint;
- OIDC mint occurs only after explicit confirmation and successful destination-pin validation;
- a failed destination check cannot be bypassed by pre-validation execution;
- no OIDC-bearing operation can occur before destination validation succeeds.

The Builder's step ordering is therefore insufficient because the confirmation check itself creates a shell-code injection surface before the validator.

The green `35 PASS / 0 FAIL` suite does not exercise adversarial `workflow_dispatch` string interpolation and does not catch this bypass.

## Surrounding invariants independently reconciled

Static review of the exact candidate still shows:

- current-runtime Control Proof and Worker Proof checks at queue, claim, and finalization;
- exactly one enabled `local-producer-watch` at `OBSERVE` / $0 with other watchers PAUSED;
- active-run cardinality gates;
- result-side zero-cost / zero-candidate enforcement;
- dedicated observe-proof GitHub OIDC claim verification;
- normal queue/executor, fulfillment, supplier connectors, and IgniAqua federation required OFF;
- ACT and consequential actions remain outside this observe-proof authority;
- `vercel.json -> git.deploymentEnabled=false`.

Live Vercel project reconciliation found no deployment for candidate `bedd8f972...`. The newest recovery-branch Preview visible at challenge time remained:

`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

from commit:

`dda91d79196a3ae0087e4ac135197eabb780bc75`

which predates the challenged candidate's Recovery CI checkout.

These preserved controls do not remove the pre-validation workflow-command injection defect.

## Final disposition

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

No repair was performed in this role. No deployment or real observation proof was executed.
