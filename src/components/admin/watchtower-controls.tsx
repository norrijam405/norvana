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
    <div className="flex flex-wrap items-center gap-3">
      {!initialized ? (
        <button
          onClick={initialize}
          disabled={pending === "bootstrap"}
          className="rounded-xl bg-indigo-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending === "bootstrap" ? "Initializing…" : "Initialize Watchtower"}
        </button>
      ) : null}

      <button
        onClick={logout}
        disabled={pending === "logout"}
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5"
      >
        Sign out
      </button>

      {message ? <p className="w-full text-sm text-amber-200">{message}</p> : null}
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
    <div className="text-right">
      <button
        onClick={toggle}
        disabled={pending}
        className={
          job.status === "ENABLED"
            ? "rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200"
            : "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60"
        }
      >
        {pending ? "Updating…" : job.status === "ENABLED" ? "Enabled" : "Paused"}
      </button>
      {error ? <p className="mt-1 text-[10px] text-red-200">{error}</p> : null}
    </div>
  );
}
