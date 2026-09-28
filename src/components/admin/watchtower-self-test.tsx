"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Proof = {
  runId: number;
  receiptId: number;
  jobCount: number;
};

export function WatchtowerSelfTest() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [proof, setProof] = useState<Proof | null>(null);
  const [error, setError] = useState("");

  async function runSelfTest() {
    setPending(true);
    setError("");
    setProof(null);

    try {
      const response = await fetch("/api/watchtower/self-test", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error || "Safe self-test failed.");
        return;
      }

      setProof({
        runId: Number(body.runId),
        receiptId: Number(body.receiptId),
        jobCount: Number(body.jobCount),
      });
      router.refresh();
    } catch {
      setError("Unable to reach the Watchtower self-test.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-border bg-bone p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-obsidian">Safe control-plane proof</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            No research, queueing, executor, spending, publishing, supplier, or fulfillment action.
          </p>
        </div>
        <button
          onClick={runSelfTest}
          disabled={pending}
          className="rounded-lg bg-indigo-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-dark disabled:opacity-50"
        >
          {pending ? "Testing…" : "Run safe self-test"}
        </button>
      </div>

      {proof ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-success">
          PASS · {proof.jobCount} paused watchers · run #{proof.runId} · receipt #{proof.receiptId}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
