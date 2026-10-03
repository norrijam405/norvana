"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FARM_FACTS } from "@/lib/acre-era/brand";

export function FarmLifeStory() {
  const [factIndex, setFactIndex] = useState(0);
  const fact = useMemo(() => FARM_FACTS[factIndex % FARM_FACTS.length], [factIndex]);

  return (
    <section id="market" className="acre-section overflow-hidden rounded-[2rem] border border-soil/10 bg-sage-wash">
      <div className="grid lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative min-h-[360px] overflow-hidden bg-soil">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            poster="/acre-era/farm-life-poster.svg"
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label="Acre Era farm-life story"
          >
            <source src="/acre-era/farm-life.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-soil via-soil/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-cream md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">Acre Era Market</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold md:text-5xl">
              See the people, places, and seasons behind the food.
            </h2>
            <p className="mt-4 max-w-lg text-sm text-cream/75">
              The video slot is ready for real partner-farm footage. Until then, the poster keeps the section polished without pretending stock footage is one of our growers.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 p-7 md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf">Farm fact</p>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug text-soil">{fact}</p>
            <button
              type="button"
              onClick={() => setFactIndex((value) => value + 1)}
              className="mt-5 text-sm font-semibold text-leaf underline decoration-leaf/30 underline-offset-4 hover:decoration-leaf"
            >
              Show another fact
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/market" className="acre-tile">
              <span className="text-sm text-muted">Shop the season</span>
              <strong className="mt-2 block text-lg">Fresh & Local →</strong>
            </Link>
            <Link href="/market#local" className="acre-tile">
              <span className="text-sm text-muted">Know the source</span>
              <strong className="mt-2 block text-lg">Meet local partners →</strong>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
