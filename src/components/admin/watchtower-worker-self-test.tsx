"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Proof = {
  runId: number;
  receiptIds: number[];
};

export function WatchtowerWorkerSelfTest({
  controlProofPassed,
}: {
  controlProofPassed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [proof, setProof] = useState<Proof | null>(null);
  const [error, setError] = useState("");

  async function runProof() {
    setPending(true);
    setProof(null);
    setError("");

    try {
      const response = await fetch("/api/watchtower/worker-self-test", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error || "Worker contract proof failed.");
        return;
      }

      setProof({
        runId: Number(body.runId),
        receiptIds: Array.isArray(body.receiptIds)
          ? body.receiptIds.map(Number)
          : [],
      });
      router.refresh();
    } catch {
      setError("Unable to reach the worker contract proof.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-bone p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-obsidian">Worker contract proof</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Proves QUEUED → RUNNING → PASS and receipts with no network, executor, spend, or candidates.
          </p>
        </div>
        <button
          onClick={runProof}
          disabled={pending || !controlProofPassed}
          className="rounded-lg bg-obsidian px-3 py-2 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Testing…" : "Run worker proof"}
        </button>
      </div>

      {!controlProofPassed ? (
        <p className="mt-3 text-xs text-muted">
          Safe control-plane proof must pass first.
        </p>
      ) : null}

      {proof ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-success">
          PASS · run #{proof.runId} · {proof.receiptIds.length} durable receipts
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
