"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JobControl = {
  id: number;
  status: string;
};

export function WatchtowerControls({ initialized }: { initialized: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function initialize() {
    setPending("bootstrap");
    setMessage("");
    const response = await fetch("/api/watchtower/bootstrap", { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error || "Watchtower initialization failed.");
    } else {
      setMessage("Watchtower initialized. All jobs start paused.");
      router.refresh();
    }
    setPending(null);
  }

  async function logout() {
    setPending("logout");
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/admin/login");
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!initialized ? (
        <button
          onClick={initialize}
          disabled={pending === "bootstrap"}
          className="rounded-lg bg-indigo-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-dark disabled:opacity-50"
        >
          {pending === "bootstrap" ? "Initializing…" : "Initialize"}
        </button>
      ) : null}

      <button
        onClick={logout}
        disabled={pending === "logout"}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-obsidian disabled:opacity-50"
      >
        {pending === "logout" ? "Signing out…" : "Sign out"}
      </button>

      {message ? (
        <p className="basis-full text-right text-xs text-warning">{message}</p>
      ) : null}
    </div>
  );
}

export function JobToggle({ job }: { job: JobControl }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setPending(true);
    setError("");
    const nextStatus = job.status === "ENABLED" ? "PAUSED" : "ENABLED";
    const response = await fetch(`/api/watchtower/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Update failed.");
    }
    setPending(false);
  }

  return (
    <div className="shrink-0 text-right">
      <button
        onClick={toggle}
        disabled={pending}
        className={
          job.status === "ENABLED"
            ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-success transition-colors hover:bg-emerald-100 disabled:opacity-50"
            : "rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-obsidian disabled:opacity-50"
        }
      >
        {pending ? "Updating…" : job.status === "ENABLED" ? "Enabled" : "Paused"}
      </button>
      {error ? <p className="mt-1 max-w-32 text-[10px] text-error">{error}</p> : null}
    </div>
  );
}
