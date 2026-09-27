const baseUrl = (process.env.NORVANA_WATCHTOWER_BASE_URL || "").replace(/\/+$/, "");
const secret = process.env.NORVANA_WATCHTOWER_WORKER_SECRET || "";
const enabled = process.env.NORVANA_WATCHTOWER_HARNESS_ENABLED === "true";

function fail(message) {
  throw new Error(message);
}

if (!enabled) fail("Deterministic Watchtower harness is not enabled.");
if (!baseUrl.startsWith("https://")) fail("Harness base URL must use HTTPS.");
if (!secret) fail("Harness worker secret is not configured.");

const claim = await fetch(`${baseUrl}/api/watchtower/runs/claim`, {
  method: "POST",
  headers: {
    "x-norvana-watchtower-worker-secret": secret,
    "x-norvana-worker-mode": "harness",
  },
});

if (claim.status === 204) fail("No queued HARNESS_TEST run is available.");

const claimText = await claim.text();
if (!claim.ok) fail(`Harness claim failed (${claim.status}): ${claimText.slice(0, 1000)}`);

const payload = JSON.parse(claimText);
if (payload?.workerMode !== "harness") fail("Claim did not return harness mode.");
if (payload?.run?.trigger !== "HARNESS_TEST") fail("Refusing to consume a non-harness run.");
if (!Number.isInteger(payload?.run?.id) || payload.run.id <= 0) fail("Invalid harness run id.");
if (payload?.job?.authority !== "OBSERVE") fail("Harness accepts OBSERVE authority only.");
if (payload?.job?.budgetCents !== 0) fail("Harness requires a $0 budget.");

const limits = payload?.hardLimits || {};
for (const [name, allowed] of Object.entries(limits)) {
  if (allowed !== false) fail(`Hard limit ${name} is not false.`);
}

const runId = payload.run.id;
const result = await fetch(`${baseUrl}/api/watchtower/runs/${runId}/result`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-norvana-watchtower-worker-secret": secret,
  },
  body: JSON.stringify({
    status: "NO_MATERIAL_CHANGE",
    summary:
      "External deterministic worker harness completed. No source research, model call, candidate emission, spend, publishing, supplier action, or fulfillment occurred.",
    findings: [
      { check: "worker_secret_auth", result: "PASS" },
      { check: "harness_trigger_isolation", result: "PASS" },
      { check: "hard_limits", result: "PASS" },
      { check: "external_research", result: "PASS", performed: false },
    ],
    evidenceRefs: [],
    candidates: [],
    modelProvider: "norvana-external-deterministic-harness",
    estimatedCostCents: 0,
  }),
});

const resultText = await result.text();
if (!result.ok) fail(`Harness result failed (${result.status}): ${resultText.slice(0, 1000)}`);

const completed = JSON.parse(resultText);
if (!completed?.accepted || completed?.runId !== runId) {
  fail("Harness result acknowledgement is invalid.");
}
if (completed?.candidateCount !== 0 || completed?.budgetExceeded) {
  fail("Harness result violated zero-candidate/zero-budget expectations.");
}

console.log(
  JSON.stringify({
    result: "PASS",
    runId,
    status: completed.status,
    candidateCount: completed.candidateCount,
    estimatedCostCents: 0,
  })
);
