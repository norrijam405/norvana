'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Clip = {
  label: string;
  videoUrl: string;
  posterUrl: string;
  sourceUrl: string;
};

const CLIPS: Clip[] = [
  {
    label: "City Pulse",
    videoUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-19627/",
  },
  {
    label: "Open Road",
    videoUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-800/",
  },
  {
    label: "Creator Grid",
    videoUrl: "https://cdn.pixabay.com/video/2020/02/05/31985-389724712_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2020/02/05/31985-389724712_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-31985/",
  },
];

export function WatchtowerHero({
  watcherCount,
  enabledCount,
  candidateCount,
  initialized,
}: {
  watcherCount: number | null;
  enabledCount: number;
  candidateCount: number;
  initialized: boolean;
}) {
  const clips = useMemo(() => CLIPS, []);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % clips.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [clips.length, reduceMotion]);

  const clip = clips[index];

  return (
    <section className="relative isolate min-h-[28rem] overflow-hidden rounded-[2rem] bg-[#11130f] text-white shadow-xl">
      <div className="absolute inset-0">
        {reduceMotion ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${clip.posterUrl}")` }}
            role="img"
            aria-label={clip.label}
          />
        ) : (
          <video
            key={clip.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            poster={clip.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={clip.label}
          >
            <source src={clip.videoUrl} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,7,.96)_0%,rgba(9,10,9,.84)_42%,rgba(9,10,9,.46)_72%,rgba(7,8,7,.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(99,102,241,.2),transparent_22rem)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_88%,rgba(232,198,138,.12),transparent_28rem)]" />
      </div>

      <div className="relative grid min-h-[28rem] gap-8 p-7 md:p-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
            ACRE ERA / OWNER CONTROL ROOM
          </p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Watchtower
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
            Your private operating view for demand, sourcing, economics, delivery, suppliers, and evidence.
            The storefront stays simple. The machinery stays here.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-100">OBSERVE</span>
            <span className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-indigo-100">RECOMMEND</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">ACT LOCKED</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">$0 DEFAULT BUDGET</span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/admin/intelligence"
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Intelligence Workbench
            </Link>
            <Link
              href="/admin/producers"
              className="rounded-xl border border-indigo-300/20 bg-indigo-300/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-300/15"
            >
              Producer Conversations
            </Link>
            <Link
              href="/admin/connections"
              className="rounded-xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Connections Center
            </Link>
            <Link
              href="/admin/account"
              className="rounded-xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Owner Account
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {clips.map((item, itemIndex) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={
                  "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition " +
                  (itemIndex === index
                    ? "border-indigo-300 bg-indigo-300 text-[#151714]"
                    : "border-white/15 bg-black/20 text-white/55 hover:border-white/30")
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <a
            href={clip.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-[10px] text-white/35 underline underline-offset-2"
          >
            Background footage source: Pixabay
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Watchers", initialized && watcherCount !== null ? String(watcherCount) : "—"],
            ["Enabled", String(enabledCount)],
            ["Candidates", String(candidateCount)],
            ["Authority", "Locked"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
