import { fetchApprovedObserveProofHtml } from "./watchtower-observe-proof-fetch.mjs";
import { requirePinnedObserveProofBaseUrl } from "./watchtower-observe-proof-destination.mjs";

const baseUrl = requirePinnedObserveProofBaseUrl();
const vercelOidcToken = process.env.NORVANA_VERCEL_OIDC_TOKEN || "";

function fail(message) {
  throw new Error(message);
}

if (!vercelOidcToken) fail("GitHub OIDC token is not configured for observe proof.");

const authHeaders = {
  "x-vercel-trusted-oidc-idp-token": vercelOidcToken,
  "x-norvana-github-oidc-token": vercelOidcToken,
};

const claim = await fetch(`${baseUrl}/api/watchtower/observe-proof/claim`, {
  method: "POST",
  headers: authHeaders,
});

const claimText = await claim.text();
if (!claim.ok) fail(`Observe-proof claim failed (${claim.status}): ${claimText.slice(0, 1000)}`);

const payload = JSON.parse(claimText);
if (payload?.workerMode !== "observe-proof") fail("Claim did not return observe-proof mode.");
if (payload?.run?.trigger !== "OBSERVE_PROOF") fail("Refusing to consume a non-observe-proof run.");
if (!Number.isInteger(payload?.run?.id) || payload.run.id <= 0) fail("Invalid observe-proof run id.");
if (payload?.job?.slug !== "local-producer-watch") fail("Observe proof target is not Local Producer Watch.");
if (payload?.job?.authority !== "OBSERVE") fail("Observe proof accepts OBSERVE authority only.");
if (payload?.job?.budgetCents !== 0) fail("Observe proof requires a $0 budget.");

const limits = payload?.hardLimits || {};
for (const name of [
  "maySpendMoney",
  "mayPublishProducts",
  "mayPlaceOrders",
  "mayChangePrices",
  "mayActivateSuppliers",
  "mayIssueRefunds",
  "mayFulfillOrders",
  "mayActivateFederation",
  "mayEmitCandidates",
]) {
  if (limits?.[name] !== false) fail(`Required hard limit ${name} is missing or not false.`);
}

const approvedSources = Array.isArray(payload?.approvedSources) ? payload.approvedSources : [];
if (approvedSources.length !== 2) fail("Observe proof requires exactly two approved public sources.");

const requiredUrls = new Set([
  "https://ag.ok.gov/divisions/market-development/",
  "https://www.ams.usda.gov/services/local-regional/food-directories",
]);
for (const source of approvedSources) {
  if (!requiredUrls.has(String(source?.url || ""))) {
    fail("Server returned an unapproved observe-proof source URL.");
  }
}

const runId = payload.run.id;
const observedAt = new Date().toISOString();
const findings = [];
const evidenceRefs = [];
let executionError = null;

function textSnippet(html, marker) {
  const normalized = html.replace(/\s+/g, " ");
  const index = normalized.toLowerCase().indexOf(marker.toLowerCase());
  if (index < 0) return "";
  const start = Math.max(0, index - 120);
  return normalized.slice(start, Math.min(normalized.length, index + marker.length + 280));
}

try {
  for (const source of approvedSources) {
    const {
      response,
      html,
      resolvedUrl,
      redirectCount,
      redirectChain,
    } = await fetchApprovedObserveProofHtml(source.url);

    const contentType = response.headers.get("content-type") || "";

    const markers = Array.isArray(source.requiredAnyMarkers)
      ? source.requiredAnyMarkers.map(String)
      : [];
    const matched = markers.find((marker) =>
      html.toLowerCase().includes(marker.toLowerCase())
    );

    if (!matched) {
      throw new Error(`Public source ${source.url} did not contain an expected evidence marker.`);
    }

    evidenceRefs.push({
      sourceName: String(source.name || ""),
      sourceUrl: resolvedUrl.toString(),
      requestedSourceUrl: source.url,
      observedAt,
      httpStatus: response.status,
      contentType,
      matchedMarker: matched,
      evidenceSnippet: textSnippet(html, matched).slice(0, 500),
      redirectCount,
      redirectChain,
    });

    findings.push({
      sourceName: String(source.name || ""),
      sourceUrl: resolvedUrl.toString(),
      requestedSourceUrl: source.url,
      observedAt,
      observation:
        "Approved official public source was retrieved read-only and contained the expected local-producer discovery marker.",
      matchedMarker: matched,
      redirectCount,
      redirectChain,
    });
  }
} catch (error) {
  executionError = error instanceof Error ? error.message : String(error);
}

const finalStatus = executionError ? "FAILED" : "PASS";
const result = await fetch(`${baseUrl}/api/watchtower/observe-proof/${runId}/result`, {
  method: "POST",
  headers: {
    ...authHeaders,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    status: finalStatus,
    summary: executionError
      ? "One-shot Local Producer Watch observe proof failed closed during approved public-source retrieval."
      : "One-shot Local Producer Watch observe proof completed against approved Oklahoma and USDA public sources with read-only retrieval, zero spend, and no candidate emission.",
    findings,
    evidenceRefs,
    candidates: [],
    modelProvider: "deterministic-public-source-observe-proof",
    estimatedCostCents: 0,
    errorMessage: executionError,
  }),
});

const resultText = await result.text();
if (!result.ok) fail(`Observe-proof result failed (${result.status}): ${resultText.slice(0, 1000)}`);

const completed = JSON.parse(resultText);
if (!completed?.accepted || completed?.runId !== runId) {
  fail("Observe-proof result acknowledgement is invalid.");
}
if (completed?.candidateCount !== 0 || completed?.estimatedCostCents !== 0) {
  fail("Observe-proof result violated zero-candidate/zero-cost expectations.");
}
if (executionError || completed?.status !== "PASS") {
  fail(executionError || `Observe-proof completed with unexpected status ${completed?.status}.`);
}

console.log(
  JSON.stringify({
    result: "PASS",
    authMode: "GITHUB_OIDC_OBSERVE_PROOF",
    runId,
    status: completed.status,
    candidateCount: completed.candidateCount,
    estimatedCostCents: completed.estimatedCostCents,
    evidenceCount: completed.evidenceCount,
    sourceCount: evidenceRefs.length,
  })
);
