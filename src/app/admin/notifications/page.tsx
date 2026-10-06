import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { WatchtowerAlertsClient } from "@/components/admin/watchtower-alerts-client";

export const dynamic = "force-dynamic";

export default async function WatchtowerNotificationsPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/notifications" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_18%,rgba(99,102,241,.2),transparent_24rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Alerts</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Your phone should only ring when it matters.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Install Watchtower, test system notifications, and choose exactly which owner events are important enough to reach you away from the dashboard.
          </p>
        </section>

        <WatchtowerAlertsClient />
      </div>
    </main>
  );
}
