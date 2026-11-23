# Acre Era IgniAqua House v1 read-only handshake R0

**Status:** non-production implementation candidate  
**Endpoint:** \`POST /api/house/v1/handshake\`  
**App identity:** \`acre-era\`  
**Runtime:** Next.js Node route handler

## Scope

The endpoint is an identity heartbeat only. It has an empty capability manifest and does not query the product catalog, orders, subscribers, suppliers, analytics, Stripe, or the application database. It does not grant product, commerce, customer, or operational authority.

## Authentication

- Dedicated secret: \`IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET\`, minimum 32 UTF-8 bytes.
- Rejects reuse of known operator/admin, database, Supabase service-role, Stripe secret, and Stripe webhook credentials.
- HMAC-SHA256 request/response signatures, exact envelope, fixed audience, 90-second timestamp window, 128-bit nonce, 16 KiB body limit, constant-time signature comparison.
- Response declares \`READ_ONLY_HEARTBEAT\`, \`writes_authorized:false\`, and \`capabilities:[]\`.

## Replay protection

Default mode is \`PROCESS_LOCAL\`. Optional \`ACRE_ERA_HOUSE_HANDSHAKE_REPLAY_DIR\` enables file-backed replay state on an explicitly mounted persistent volume. It stores SHA-256 nonce hashes and expiry only, uses exclusive file creation, retains 180 seconds, prunes expired entries, and fails closed at its 10,000-entry cap or on storage failure. It never silently downgrades from a configured store.

Tests recreate the handler against the same directory and confirm replay denial. A configured path alone does not prove the hosting volume survives deployment replacement. The Control Panel must keep durable replay verification false until the actual mounted-volume and deployment behavior is independently proven.

## Release boundary

No secret, replay directory, Control Panel URL/secret, deployment, DB mutation, customer-data access, or production change is part of this draft. A successful handshake does not prove app health, product data correctness, deployment parity, or operational authority.
