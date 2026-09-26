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
    <main className="min-h-screen bg-obsidian px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin" className="text-sm text-indigo-light hover:underline">
          ← Back to Watchtower
        </Link>

        <p className="mt-8 text-xs tracking-[0.28em] text-indigo-light">NORVANA / OWNER</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Account security</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          After the first successful bootstrap login, Norvana persists the owner credential in its
          database. Changing the password here makes the bootstrap password non-authoritative.
        </p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="font-display text-lg font-bold">Change password</h2>
          <p className="mt-2 text-sm text-white/45">
            Use at least 12 characters. Do not reuse a password from another service.
          </p>
          <div className="mt-6">
            <OwnerPasswordForm />
          </div>
        </section>
      </div>
    </main>
  );
}
