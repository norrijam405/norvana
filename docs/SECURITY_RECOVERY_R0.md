# Norvana Security Recovery R0

## Current classification

The historical repository contains production-like and credential-like material. Treat every historical secret as compromised if it still exists at a provider.

Removing a value from the current branch does not remove it from Git history.

## Required provider-side action

For every surviving service referenced by historical Norvana material:

1. identify the credential at the provider;
2. revoke or rotate it;
3. issue a least-privilege replacement only if the service is still needed;
4. store the replacement in managed environment/secret custody;
5. verify the old credential no longer works;
6. preserve a redacted rotation receipt.

Never recover a secret by copying it out of Git history.

## Recovery defaults

- Engine Room browser admin: disabled until server-side auth/session exists.
- Privileged API mutations: fail closed.
- Supplier fulfillment: disabled by default.
- Supplier credentials: no browser-readable secret responses.
- Checkout totals: server is canonical for product price and shipping calculations.
- Scout: historical static/demo signals are not current market evidence.
- Debugger/self-repair: unrestricted mutation is not part of the modern design.
- Payments: Stripe webhook signatures must verify before payment state changes.

## Consequential-action gate

Before a future external action:

Norvana mission
→ qualified worker/runtime
→ workspace policy
→ qualified connector
→ authority grant
→ human approval where required
→ execute
→ readback
→ verify
→ receipt

External fulfillment and financing enrollment remain separate authority classes.

## Historical exposure note

This branch can remove live literals from the current tree, but it cannot make an already-public historical credential secret again. Provider-side rotation/revocation is mandatory.
