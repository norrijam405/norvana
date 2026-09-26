"use client";

import { FormEvent, useState } from "react";

export function OwnerPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error || "Unable to change password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setMessage("Owner password changed. The old bootstrap password will no longer authenticate.");
    } catch {
      setError("Unable to reach the owner identity service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordField
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />
      <PasswordField
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-indigo-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Changing…" : "Change owner password"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <input
        type="password"
        minLength={12}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-indigo-light"
      />
    </label>
  );
}
