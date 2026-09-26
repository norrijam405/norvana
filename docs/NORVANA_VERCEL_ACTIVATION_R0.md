# Norvana Vercel Activation R0

**Status:** deployment activation runbook  
**Target:** recovery preview first; production promotion later

## Confirmed deployment path

GitHub's Vercel integration confirms the active Norvana repository is connected to the Vercel project:

`norrijam405-2107s-projects/norvana`

Use the recovery branch preview for proof before changing `main` or the production domain.

## Preview-first environment configuration

Configure these for the recovery preview scope first:

### Required existing runtime

- `DATABASE_URL`
- Stripe configuration only if checkout proof is in scope.

### Owner bootstrap

- `NORVANA_ADMIN_PASSWORD_SALT`
- `NORVANA_ADMIN_PASSWORD_HASH`
- `NORVANA_ADMIN_SESSION_SECRET`

The bootstrap password values establish first access only. On first successful login, Norvana persists the owner identity in its database. The owner should immediately rotate the password from `/admin/account`.

After rotation, the bootstrap password is not authoritative even before its environment values are removed.

### Recovery

- `NORVANA_ADMIN_RECOVERY_ENABLED=false`
- `NORVANA_ADMIN_RECOVERY_SECRET`

Recovery remains disabled during normal operation. Enable temporarily only for an owner password reset, verify the new login, then disable again.

### Watchtower

- `NORVANA_WATCHTOWER_CRON_SECRET`
- `NORVANA_WATCHTOWER_QUEUE_ENABLED=false`
- `NORVANA_WATCHTOWER_EXECUTOR_ENABLED=false`
- `NORVANA_WATCHTOWER_WORKER_SECRET`

### Existing consequential-action locks

- `NORVANA_EXTERNAL_FULFILLMENT_ENABLED=false`
- `NORVANA_SUPPLIER_CONNECTORS_ENABLED=false`
- `IGNIAQUA_FEDERATION_ENABLED=false` until federation proof is ready.

## Activation sequence

1. Verify current recovery head passes GitHub CI and Vercel reports deployment Ready.
2. Verify Preview has a working `DATABASE_URL` without copying its value into chat, Git, or receipts.
3. Configure fresh owner bootstrap/session values in Vercel Preview.
4. Visit the recovery Preview `/admin/login`.
5. Perform the bootstrap login.
6. Confirm `admin_users` durable owner identity was created.
7. Open `/admin/account` and rotate to the founder's private password.
8. Verify the bootstrap password no longer authenticates.
9. Initialize Watchtower from `/admin`.
10. Verify the five default jobs exist and begin PAUSED.
11. Verify ACT authority is locked.
12. Configure scheduler secret but leave queue disabled.
13. Call scheduler endpoint and prove it reports queue disabled with zero queued work.
14. Enable one OBSERVE/RECOMMEND test job only after executor proof is ready.
15. Preserve run/evidence/action receipt.
16. Independently challenge the R0 authority boundaries before production promotion.

## Promotion rule

A Vercel deployment being Ready is not equivalent to Watchtower being operationally proven.

Do not promote to production until:

- admin login proof;
- password rotation proof;
- recovery-disabled proof;
- Watchtower DB bootstrap proof;
- scheduler inert-state proof;
- worker execution proof;
- evidence/receipt proof;
- authority-bypass challenge;
- rollback path.

## Secret handling

Never place secret values in:

- Git commits;
- PR comments;
- screenshots intended as durable evidence;
- Watchtower findings;
- public logs;
- customer-facing pages.

Receipts should record secret **presence/configuration state and safe fingerprints where useful**, not secret values.


## Preview environment reload checkpoint — 2026-09-26

A fresh recovery-branch deployment is intentionally triggered after founder-side Preview environment configuration so the runtime can reload server-side Watchtower authentication settings. This checkpoint does not promote to production or change Watchtower authority.


## Preview password-reset reload checkpoint — 2026-09-26

A fresh recovery-branch Preview deployment is intentionally triggered after the founder-side bootstrap password reset so Vercel can reload the updated Preview-only owner credential. This checkpoint does not promote to production and does not change Watchtower authority.
