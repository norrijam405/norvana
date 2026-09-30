# NORVANA WATCHTOWER R0 — OWNER BROWSER HELPER FOR CONTROLLED REAL OBSERVE PROOF

Date: 2026-09-30

Use only after the separate Controlled Live-Proof Operator has created the exact new Preview and explicitly confirms that the owner-runtime phase is ready.

Norris must sign in normally on that exact Preview.

Do not paste passwords, cookies, session tokens, or secrets into chat.

From the authenticated Preview `/admin` page, this fail-closed helper performs only the founder-authorized owner mutations required for the proof:

```javascript
(async () => {
  const call = async (path, options = {}) => {
    const response = await fetch(path, options);
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    return { response, body };
  };

  const mustOk = (label, result) => {
    if (!result.response.ok) {
      throw new Error(
        label + " failed: " +
        result.response.status + " " +
        JSON.stringify(result.body)
      );
    }
    return result.body;
  };

  const control = mustOk(
    "Control Proof",
    await call("/api/watchtower/self-test", { method: "POST" })
  );

  if (control?.ok !== true) {
    throw new Error("Control Proof did not return ok=true.");
  }

  const worker = mustOk(
    "Worker Proof",
    await call("/api/watchtower/worker-self-test", { method: "POST" })
  );

  if (worker?.ok !== true) {
    throw new Error("Worker Proof did not return ok=true.");
  }

  let jobs = mustOk(
    "Watchtower job read",
    await call("/api/watchtower/jobs")
  );

  if (!Array.isArray(jobs)) {
    throw new Error("Watchtower jobs response was not an array.");
  }

  if (jobs.some((job) => job.status !== "PAUSED")) {
    throw new Error("Expected every watcher PAUSED before activation.");
  }

  const target = jobs.find((job) => job.slug === "local-producer-watch");
  if (!target) {
    throw new Error("local-producer-watch was not found.");
  }

  if (target.budgetCents !== 0) {
    throw new Error("Local Producer Watch budget is not zero.");
  }

  mustOk(
    "Enable Local Producer Watch",
    await call("/api/watchtower/jobs/" + target.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "ENABLED",
        authority: "OBSERVE",
      }),
    })
  );

  jobs = mustOk(
    "Post-enable Watchtower job read",
    await call("/api/watchtower/jobs")
  );

  const enabled = jobs.filter((job) => job.status === "ENABLED");
  if (
    enabled.length !== 1 ||
    enabled[0].slug !== "local-producer-watch" ||
    enabled[0].authority !== "OBSERVE" ||
    enabled[0].budgetCents !== 0
  ) {
    throw new Error(
      "Post-enable watcher snapshot is not exactly Local Producer Watch / OBSERVE / $0."
    );
  }

  if (
    jobs.some(
      (job) =>
        job.slug !== "local-producer-watch" &&
        job.status !== "PAUSED"
    )
  ) {
    throw new Error("A non-target watcher is not PAUSED.");
  }

  const queued = mustOk(
    "Observe Proof queue",
    await call("/api/watchtower/observe-proof/queue", {
      method: "POST",
    })
  );

  if (
    queued?.ok !== true ||
    queued?.queued !== true ||
    queued?.trigger !== "OBSERVE_PROOF" ||
    queued?.targetSlug !== "local-producer-watch" ||
    queued?.estimatedCostCents !== 0
  ) {
    throw new Error(
      "Observe Proof queue acknowledgement violated the expected contract: " +
      JSON.stringify(queued)
    );
  }

  const result = {
    result: "WATCHTOWER_REAL_OBSERVE_OWNER_CHAIN_READY",
    controlRunId: control.runId,
    controlReceiptId: control.receiptId,
    workerRunId: worker.runId,
    workerReceiptIds: worker.receiptIds,
    observeProofRunId: queued.runId,
    observeProofReceiptId: queued.receiptId,
    runtimeId: queued.runtimeId,
    targetSlug: queued.targetSlug,
    estimatedCostCents: queued.estimatedCostCents,
  };

  console.log(result);
  alert(JSON.stringify(result));
  return result;
})().catch((error) => {
  console.error(error);
  alert("STOPPED FAIL-CLOSED: " + String(error?.message || error));
  throw error;
});
```

Do not run this helper until the Controlled Live-Proof Operator explicitly says the exact new Preview is ready.
