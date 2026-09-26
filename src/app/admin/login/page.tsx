"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Unable to sign in.");
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("Unable to reach the Norvana admin service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-obsidian text-white grid place-items-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="text-xs tracking-[0.28em] text-indigo-light">NORVANA / WATCHTOWER</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Owner sign in</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          The historical browser password is retired. This login uses a server-side
          password hash and an HttpOnly signed session.
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
