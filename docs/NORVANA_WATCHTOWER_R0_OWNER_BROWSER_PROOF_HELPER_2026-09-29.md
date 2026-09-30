# NORVANA WATCHTOWER R0 — OWNER BROWSER PROOF HELPER

Date: 2026-09-29

Purpose: continue the exact controlled-live proof on the READY Preview after the founder signs in normally.

Exact Preview:
`https://norvana-bg60h5b0c-norrijam405-2107s-projects.vercel.app/admin`

This helper must be executed only from that Preview's authenticated `/admin` page.

It does not contain, collect, or transmit the owner password.

## Fail-closed browser helper

```javascript
(async () => {
  const call = async (path) => {
    const response = await fetch(path, { method: "POST" });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    return { response, body };
  };

  let control = await call("/api/watchtower/self-test");

  if (
    control.response.status === 409 &&
    control.body?.code === "WATCHTOWER_STALE_EXECUTABLE_RUNS_PRESENT"
  ) {
    const retire = await call("/api/watchtower/harness/retire-stale");
    if (!retire.response.ok || retire.body?.retired !== true) {
      throw new Error(
        "Stale-run retirement did not complete: " +
          retire.response.status +
          " " +
          JSON.stringify(retire.body)
      );
    }
    control = await call("/api/watchtower/self-test");
  }

  if (!control.response.ok || control.body?.ok !== true) {
    throw new Error(
      "Control Proof failed: " +
        control.response.status +
        " " +
        JSON.stringify(control.body)
    );
  }

  const worker = await call("/api/watchtower/worker-self-test");
  if (!worker.response.ok || worker.body?.ok !== true) {
    throw new Error(
      "Worker Proof failed: " +
        worker.response.status +
        " " +
        JSON.stringify(worker.body)
    );
  }

  const queue = await call("/api/watchtower/harness/queue");
  if (!queue.response.ok || queue.body?.queued !== true) {
    throw new Error(
      "Harness queue failed: " +
        queue.response.status +
        " " +
        JSON.stringify(queue.body)
    );
  }

  const result = {
    result: "WATCHTOWER_OWNER_CHAIN_READY",
    controlRunId: control.body.runId,
    controlReceiptId: control.body.receiptId,
    workerRunId: worker.body.runId,
    workerReceiptIds: worker.body.receiptIds,
    harnessRunId: queue.body.runId,
    harnessReceiptId: queue.body.receiptId,
    runtimeId: queue.body.runtimeId,
    estimatedCostCents: queue.body.estimatedCostCents,
  };

  alert(JSON.stringify(result));
  return result;
})().catch((error) => {
  alert("STOPPED FAIL-CLOSED: " + String(error?.message || error));
  throw error;
});
```

## Expected safe result

The final alert must begin with:

`WATCHTOWER_OWNER_CHAIN_READY`

and must show:

- current-runtime Control Proof identifiers;
- current-runtime Worker Proof identifiers;
- exactly one fresh HARNESS_TEST run identifier;
- estimated cost `0`.

If any call fails, the helper stops immediately and does not continue to the next stage.

Do not enable any real watcher, normal queue, normal executor, supplier connector, fulfillment path, federation, publishing, ordering, repricing, refund, or supplier-activation authority.

After the helper succeeds, the next action is exactly one NEW GitHub manual external harness dispatch from main. Do not rerun a historical workflow.
