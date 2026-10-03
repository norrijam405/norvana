"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "./footer";

type ArchivedPartnerCollection = {
  id: number;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  productCount: number;
};

export function PartnerArchiveClient({
  collections,
}: {
  collections: ArchivedPartnerCollection[];
}) {
  return (
    <>
      <main className="min-h-screen bg-bone text-soil">
        <section className="border-b border-soil/10 bg-wheat/20">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf">Partner Archive</p>
            <h1 className="mt-3 font-display text-4xl font-black md:text-6xl">Past partner curations</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              Partner Eras are time-stamped instead of silently disappearing. A past find can remain part of Acre Era&apos;s story even after price, availability, or an affiliate relationship changes.
            </p>
            <Link href="/partners" className="mt-6 inline-block text-sm font-semibold text-leaf">
              ← Back to Partner Market
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {collections.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection, index) => (
                <motion.article
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.07, 0.28) }}
                  className="rounded-[1.8rem] border border-soil/10 bg-cream p-6 shadow-[0_18px_50px_rgba(48,46,35,.05)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-leaf">
                    {collection.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-bold">{collection.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{collection.description}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-soil/10 pt-4 text-xs text-muted">
                    <span>
                      {collection.startDate || "Undated"}
                      {collection.endDate ? " → " + collection.endDate : ""}
                    </span>
                    <span>{collection.productCount} finds</span>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-soil/15 bg-cream p-10 text-center">
              <p className="text-4xl">🗂️</p>
              <h2 className="mt-4 font-display text-2xl font-bold">No Partner Eras have closed yet.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                Once a partner curation ends, it can live here with its original dates and product count instead of being erased.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
