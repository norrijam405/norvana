import { requireWatchtowerR1Enabled } from "./watchtower-r1-config.mjs";
import { requirePinnedObserveProofBaseUrl } from "./watchtower-observe-proof-destination.mjs";

requireWatchtowerR1Enabled();

const baseUrl = requirePinnedObserveProofBaseUrl();
const vercelOidcToken = process.env.NORVANA_VERCEL_OIDC_TOKEN || "";

if (!vercelOidcToken) {
  throw new Error("GitHub OIDC token is not configured for Watchtower R1.");
}

const authHeaders = {
  "x-vercel-trusted-oidc-idp-token": vercelOidcToken,
  "x-norvana-github-oidc-token": vercelOidcToken,
};

const queued = await fetch(`${baseUrl}/api/watchtower/observe-r1/queue`, {
  method: "POST",
  headers: authHeaders,
});

const queuedText = await queued.text();
if (!queued.ok) {
  throw new Error(
    `R1 queue failed (${queued.status}): ${queuedText.slice(0, 1000)}`
  );
}

const acknowledgement = JSON.parse(queuedText);

if (
  acknowledgement?.ok !== true ||
  acknowledgement?.queued !== true ||
  acknowledgement?.mode !== "R1_BOUNDED_RECURRING_OBSERVE" ||
  acknowledgement?.trigger !== "OBSERVE_PROOF" ||
  acknowledgement?.targetSlug !== "local-producer-watch" ||
  acknowledgement?.estimatedCostCents !== 0 ||
  !Number.isInteger(acknowledgement?.runId) ||
  acknowledgement.runId <= 0
) {
  throw new Error(
    "R1 queue acknowledgement violated the bounded recurring observe contract."
  );
}

console.log(
  JSON.stringify({
    result: "R1_QUEUE_PASS",
    runId: acknowledgement.runId,
    receiptId: acknowledgement.receiptId,
    runtimeId: acknowledgement.runtimeId,
    minimumIntervalHours: acknowledgement.minimumIntervalHours,
  })
);

await import("./watchtower-observe-proof.mjs");
