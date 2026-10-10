"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FARM_FACTS } from "@/lib/acre-era/brand";

export function FarmLifeStory({
  videoUrl,
  posterUrl,
}: {
  videoUrl?: string | null;
  posterUrl?: string | null;
}) {
  const [factIndex, setFactIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fact = useMemo(() => FARM_FACTS[factIndex % FARM_FACTS.length], [factIndex]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <section id="market" className="acre-section overflow-hidden rounded-[2rem] border border-soil/10 bg-sage-wash">
      <div className="grid lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative min-h-[300px] overflow-hidden bg-soil sm:min-h-[360px]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{ backgroundImage: `url("${posterUrl || "/acre-era/farm-life-poster.svg"}")` }}
            role="img"
            aria-label="Acre Era farm-life story"
          />
          {videoUrl && !reduceMotion && !videoFailed ? (
            <video
              ref={videoRef}
              className={"absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " + (videoPlaying ? "opacity-75" : "opacity-0")}
              poster={posterUrl || "/acre-era/farm-life-poster.svg"}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              aria-label="Acre Era farm-life story video"
              onCanPlay={() => {
                const video = videoRef.current;
                if (!video) return;
                video.muted = true;
                void video.play().catch(() => setVideoFailed(true));
              }}
              onPlaying={() => setVideoPlaying(true)}
              onError={() => {
                setVideoPlaying(false);
                setVideoFailed(true);
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-soil via-soil/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-cream sm:p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">Acre Era Market</p>
            <h2 className="mt-3 max-w-xl font-display text-2xl font-bold sm:text-3xl md:text-5xl">
              See the people, places, and seasons behind the food.
            </h2>
            <p className="mt-4 max-w-lg text-sm text-cream/75">
              A closer look at the kind of seasonal, local-food experience Acre Era is building. When a real partner joins, their own story and media can take this space with permission.
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
