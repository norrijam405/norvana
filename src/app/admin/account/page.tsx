import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { OwnerPasswordForm } from "@/components/admin/owner-password-form";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  if (!adminSessionConfigured()) redirect("/admin");

  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-bone text-obsidian">
      <header className="border-b border-border bg-bone/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-xl font-bold tracking-wider">NORVANA</Link>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-sm text-muted sm:block">Owner Security</span>
          </div>
          <Link href="/admin" className="btn-secondary px-4 py-2 text-sm">Back to Watchtower</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian via-gray-900 to-obsidian p-8 text-white shadow-lg md:p-10">
          <p className="text-xs font-medium tracking-[0.28em] text-indigo-light">NORVANA / OWNER</p>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Account security</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
            After the first successful bootstrap login, Norvana can persist your owner credential
            in its database. Rotating it here makes the temporary bootstrap password non-authoritative.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-accent">Credentials</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Change owner password</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use at least 12 characters and do not reuse a password from another service.
            </p>
            <div className="mt-7">
              <OwnerPasswordForm />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-accent">Security model</p>
              <h2 className="mt-2 font-display text-lg font-bold">Owner-controlled</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Your permanent password is stored as a salted hash. Watchtower sessions use an HttpOnly signed cookie.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-accent">Authority</p>
              <h2 className="mt-2 font-display text-lg font-bold">No authority expansion</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Changing your password does not enable Watchtower execution, spending, fulfillment, or supplier actions.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
