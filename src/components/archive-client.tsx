"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "./footer";

type ArchiveEra = {
  id: number;
  slug: string;
  name: string;
  eyebrow: string;
  story: string;
  kind: string;
  lifecycleState: string;
  startAt: Date | string | null;
  endAt: Date | string | null;
};

function dateLabel(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ArchiveClient({ eras }: { eras: ArchiveEra[] }) {
  return (
    <>
      <main className="min-h-screen bg-bone">
        <section className="border-b border-soil/10 bg-soil text-cream">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">Acre Era Archive</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Past worlds stay worth revisiting.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/70">
              The Archive keeps past Acre Eras understandable as they were presented at the time. It is a history of what we featured, not a graveyard of old placeholder collections.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {eras.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {eras.map((era, index) => (
                <motion.article
                  key={era.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.06 }}
                  className="overflow-hidden rounded-[1.75rem] border border-soil/10 bg-cream shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-soil">
                    <div className="absolute inset-0 acre-contours opacity-40" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wheat">
                        {era.eyebrow || "From the Archive"}
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-bold">{era.name}</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 text-xs text-muted">
                      <span>{era.kind.replaceAll("_", " ")}</span>
                      {dateLabel(era.startAt) || dateLabel(era.endAt) ? (
                        <span>
                          · {dateLabel(era.startAt) || "Started"} {dateLabel(era.endAt) ? "→ " + dateLabel(era.endAt) : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                      {era.story || "Revisit the products and story that defined this Acre Era."}
                    </p>
                    <Link
                      href={"/era/" + era.slug}
                      className="mt-5 inline-flex text-sm font-semibold text-leaf underline decoration-leaf/25 underline-offset-4"
                    >
                      Revisit this Era →
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[2rem] border border-soil/10 bg-cream p-8 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">The shelves are new</p>
                <h2 className="mt-3 font-display text-3xl font-bold">No Acre Eras have closed yet.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
                  That is normal this early. Once a real Era finishes, it will live here with its original story and curation instead of being rewritten into something it was not.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/" className="btn-primary">See what is current</Link>
                  <Link href="/market" className="btn-secondary">Explore Market</Link>
                </div>
              </div>
              <div className="rounded-[2rem] bg-sage-wash p-8 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">What belongs here</p>
                <div className="mt-5 space-y-3">
                  {[
                    "Past seasonal collections",
                    "Popular discovery Eras",
                    "Farm and local-market moments",
                    "Family, pets, beauty, tech and more",
                  ].map((item) => (
                    <div key={item} className="rounded-xl bg-cream px-4 py-3 text-sm font-medium text-soil">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
