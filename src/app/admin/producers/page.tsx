import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProducerConversationNotebook } from "@/components/admin/producer-conversation-notebook";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function ProducerConversationPage() {
  if (!adminSessionConfigured()) redirect("/admin");

  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  const persistenceEnabled =
    process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED === "true";

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/producers" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_20%,rgba(99,102,241,.18),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
            Conversation intelligence
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Talk like a person. Capture like a system.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            This is the detailed call sheet for farms, food hubs, makers, and producers. Use the public form for a light introduction; use this notebook for the real conversation, follow-up, and pilot decision.
          </p>
        </section>

        <ProducerConversationNotebook persistenceEnabled={persistenceEnabled} />
      </div>
    </main>
  );
}
