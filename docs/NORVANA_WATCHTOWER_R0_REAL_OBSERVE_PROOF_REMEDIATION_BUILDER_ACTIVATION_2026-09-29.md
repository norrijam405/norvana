# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER ACTIVATION

Date: 2026-09-29

You are the Remediation Builder for the new post-assurance finding:

`NW-R0-OBS-01 — REAL_OBSERVE_ACTIVATION_DEADLOCKS_ON_RUNTIME_BOUND_PROOFS_AND_DEPLOYMENT_TIME_QUEUE_EXECUTOR_FLAGS`

Repository:
`norrijam405/norvana`

PR:
`#1`

Branch:
`recovery/2026-09-26-norvana-modernization-r0`

Independent Assurance for the prior remediation remains PASS and must not be rewritten.

## Builder mission

Implement the narrowest safe one-shot real observation proof lane.

Required invariants:

1. Normal scheduler queue remains OFF.
2. Normal executor remains OFF.
3. External fulfillment remains OFF.
4. Supplier connectors remain OFF.
5. IgniAqua federation remains OFF.
6. ACT remains locked.
7. Real-observe proof target must be exactly OBSERVE authority and $0.
8. Initial allowed target is `local-producer-watch` only.
9. Current-runtime Control Proof and Worker Proof are required at queue, claim, and finalization.
10. Exactly one active `OBSERVE_PROOF` run may exist.
11. Proof worker authentication must be separately bounded and must not become standard worker authority.
12. Proof execution may perform read-only public source retrieval only.
13. It must not create recommendation candidates.
14. It must report `estimatedCostCents=0`.
15. It must preserve structured findings/evidence references and a durable completion receipt.
16. It must not claim or finalize `SCHEDULE` or `HARNESS_TEST` runs.
17. One-shot proof must remain manual/founder-gated.
18. Add adversarial regression tests for scope confusion, duplicate active proof runs, stale runtime, watcher/authority drift, nonzero cost, candidate emission, and consequential-action configuration drift.

Do not deploy or execute the real observation proof from the Builder role.
Do not self-certify Fresh Challenger or Independent Assurance.
Bank the exact executable candidate and hand it to a separate Fresh Challenger.
