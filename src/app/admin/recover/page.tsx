"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AdminRecoverPage() {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoverySecret: recoveryCode,
          newPassword,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(body.error || "Recovery failed.");
        return;
      }

      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Password reset. You can return to sign in.");
    } catch {
      setStatus("Unable to reach the recovery service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-obsidian text-white grid place-items-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-xs tracking-[0.28em] text-indigo-light">NORVANA / RECOVERY</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Reset owner password</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Recovery works only while the server-side recovery gate is explicitly enabled.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <PasswordField label="Recovery code" value={recoveryCode} onChange={setRecoveryCode} />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} minLength={12} />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} minLength={12} />

          {status ? <p className="rounded-xl bg-white/5 p-3 text-sm text-white/70">{status}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <Link href="/admin/login" className="mt-6 inline-block text-sm text-indigo-light hover:underline">
          Back to owner sign in
        </Link>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <input
        type="password"
        required
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-indigo-light"
      />
    </label>
  );
}
