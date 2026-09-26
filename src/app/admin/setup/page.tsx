"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ITERATIONS = 310000;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function randomToken(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function derivePasswordHash(password: string, saltHex: string) {
  const encoder = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((part) => parseInt(part, 16)) || []);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    key,
    512
  );
  return bytesToHex(new Uint8Array(bits));
}

type SetupStatus = {
  environment: string;
  databaseReachable: boolean;
  ownerIdentityPresent: boolean;
  sessionSecretConfigured: boolean;
  bootstrapCredentialConfigured: boolean;
  recoverySecretConfigured: boolean;
  recoveryEnabled: boolean;
  schedulerSecretConfigured: boolean;
  workerSecretConfigured: boolean;
  queueEnabled: boolean;
  executorEnabled: boolean;
  externalFulfillmentEnabled: boolean;
  supplierConnectorsEnabled: boolean;
  igniaquaFederationEnabled: boolean;
  safeToBootstrap: boolean;
};

export default function AdminSetupPage() {
  const [bundle, setBundle] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/setup-status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setStatus(body))
      .catch(() => setStatus(null));
  }, []);

  async function generate() {
    setPending(true);
    setCopied("");

    const password = randomToken(18);
    const salt = randomHex(24);
    const digest = await derivePasswordHash(password, salt);
    const hash = `pbkdf2:${ITERATIONS}:sha256:${digest}`;

    const values = [
      `NORVANA_ADMIN_PASSWORD_SALT=${salt}`,
      `NORVANA_ADMIN_PASSWORD_HASH=${hash}`,
      `NORVANA_ADMIN_SESSION_SECRET=${randomHex(48)}`,
      "NORVANA_ADMIN_RECOVERY_ENABLED=false",
      `NORVANA_ADMIN_RECOVERY_SECRET=${randomHex(32)}`,
      `NORVANA_WATCHTOWER_CRON_SECRET=${randomHex(32)}`,
      "NORVANA_WATCHTOWER_QUEUE_ENABLED=false",
      "NORVANA_WATCHTOWER_EXECUTOR_ENABLED=false",
      `NORVANA_WATCHTOWER_WORKER_SECRET=${randomHex(32)}`,
      "NORVANA_EXTERNAL_FULFILLMENT_ENABLED=false",
      "NORVANA_SUPPLIER_CONNECTORS_ENABLED=false",
      "IGNIAQUA_FEDERATION_ENABLED=false",
    ].join("\n");

    setBootstrapPassword(password);
    setBundle(values);
    setPending(false);
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  return (
    <main className="min-h-screen bg-obsidian px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.28em] text-indigo-light">NORVANA / WATCHTOWER SETUP</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Generate Preview setup values</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
          Everything on this page is generated locally in your browser. Your temporary password
          and generated secrets are not sent to Norvana, Vercel, ChatGPT, or an API by this page.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
          Use these values for the Vercel <strong>Preview</strong> environment first. Do not add them
          to GitHub or paste them into chat.
        </div>
        {status ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Preview preflight</p>
                <p className="mt-2 text-sm text-white/60">Environment: {status.environment}</p>
              </div>
              <span className={status.safeToBootstrap ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200" : "rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100"}>
                {status.safeToBootstrap ? "READY TO BOOTSTRAP" : "SETUP REQUIRED"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Check label="Database" ok={status.databaseReachable} />
              <Check label="Owner identity" ok={status.ownerIdentityPresent} optional />
              <Check label="Session secret" ok={status.sessionSecretConfigured} />
              <Check label="Bootstrap credential" ok={status.bootstrapCredentialConfigured || status.ownerIdentityPresent} />
              <Check label="Recovery secret" ok={status.recoverySecretConfigured} />
              <Check label="Scheduler secret" ok={status.schedulerSecretConfigured} />
              <Check label="Worker secret" ok={status.workerSecretConfigured} />
              <Check label="ACT/execution locked" ok={!status.queueEnabled && !status.executorEnabled && !status.externalFulfillmentEnabled && !status.supplierConnectorsEnabled && !status.igniaquaFederationEnabled} />
            </div>
          </section>
        ) : null}


        {!bundle ? (
          <button
            onClick={generate}
            disabled={pending}
            className="mt-8 rounded-xl bg-indigo-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Generating securely…" : "Generate Watchtower setup bundle"}
          </button>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Temporary login password</p>
              <code className="mt-3 block break-all rounded-xl bg-black/30 p-4 text-sm text-indigo-light">
                {bootstrapPassword}
              </code>
              <button
                onClick={() => copy(bootstrapPassword, "password")}
                className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65"
              >
                {copied === "password" ? "Copied" : "Copy temporary password"}
              </button>
              <p className="mt-3 text-xs leading-5 text-white/35">
                Save this only long enough to complete the first login. After signing in, change it
                from Watchtower → Account.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Vercel Preview environment values</p>
                  <h2 className="mt-2 font-display text-xl font-bold">Copy into Environment Variables</h2>
                </div>
                <button
                  onClick={() => copy(bundle, "bundle")}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65"
                >
                  {copied === "bundle" ? "Copied" : "Copy all"}
                </button>
              </div>
              <pre className="mt-5 max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/30 p-4 font-mono text-xs leading-6 text-white/70">
                {bundle}
              </pre>
            </section>

            <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h2 className="font-display text-lg font-bold text-emerald-100">After Vercel redeploys</h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-emerald-50/75">
                <li>1. Open the Preview <code>/admin/login</code>.</li>
                <li>2. Sign in with the temporary password above.</li>
                <li>3. Initialize Watchtower.</li>
                <li>4. Open Account and change to your private permanent password.</li>
                <li>5. Keep queue/executor/external actions disabled until verification is complete.</li>
              </ol>
            </section>

            <button
              onClick={generate}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60"
            >
              Discard and generate a new bundle
            </button>
          </div>
        )}

        <div className="mt-10 flex gap-4 text-sm">
          <Link href="/admin" className="text-indigo-light hover:underline">Back to Watchtower</Link>
          <Link href="/" className="text-white/45 hover:text-white">Storefront</Link>
        </div>
      </div>
    </main>
  );
}


function Check({
  label,
  ok,
  optional = false,
}: {
  label: string;
  ok: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
      <span className="text-white/55">{label}{optional ? " (after first login)" : ""}</span>
      <span className={ok ? "text-emerald-200" : optional ? "text-white/30" : "text-amber-100"}>
        {ok ? "READY" : optional ? "PENDING" : "MISSING"}
      </span>
    </div>
  );
}
