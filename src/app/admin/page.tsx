import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-obsidian text-white flex items-center justify-center px-4">
      <section className="w-full max-w-xl border border-white/10 rounded-2xl p-8 bg-white/5">
        <p className="text-xs tracking-[0.25em] text-indigo-light">NORVANA / ENGINE ROOM</p>
        <h1 className="font-display text-3xl font-bold mt-3">Recovery mode</h1>
        <p className="text-white/70 mt-4 leading-7">
          The historical browser-password admin console is intentionally disabled.
          Norvana is being rebuilt with server-side identity, scoped permissions,
          action receipts, and fail-closed external-action gates.
        </p>
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60 space-y-2">
          <p>Storefront browsing can continue during recovery.</p>
          <p>Supplier ordering, credential mutation, and self-repair are not authorized from this screen.</p>
        </div>
        <Link href="/" className="btn-primary inline-flex mt-6">Return to Store</Link>
      </section>
    </main>
  );
}
