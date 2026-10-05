"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, rememberDevice }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Unable to sign in.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Unable to reach the Norvana admin service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-obsidian text-white grid place-items-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="text-xs tracking-[0.28em] text-indigo-light">ACRE ERA / WATCHTOWER</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Owner sign in</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Private owner access. Your password is verified server-side and the browser receives only a signed HttpOnly session.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/70">
            Admin password
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-indigo-light"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block font-medium text-white">Remember this device for 30 days</span>
              <span className="mt-1 block text-xs leading-5 text-white/45">
                Use this only on a device you control. Signing out or changing the owner password still invalidates the session.
              </span>
            </span>
          </label>

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            disabled={pending}
            className="w-full rounded-xl bg-indigo-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
            type="submit"
          >
            {pending ? "Signing in…" : "Enter Watchtower"}
          </button>
        </form>

        <Link href="/admin/recover" className="mt-5 inline-block text-sm text-white/45 hover:text-indigo-light">Forgot your password?</Link>
      </section>
    </main>
  );
}
