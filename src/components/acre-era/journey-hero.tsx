'use client';

import { useEffect, useMemo, useState } from "react";

type JourneyClip = {
  label: string;
  videoUrl: string;
  posterUrl: string;
  sourceUrl: string;
};

const HOME_CLIPS: JourneyClip[] = [
  {
    label: "Mountains",
    videoUrl: "https://cdn.pixabay.com/video/2025/09/22/305657_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2025/09/22/305657_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-305657/",
  },
  {
    label: "Open Road",
    videoUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-800/",
  },
  {
    label: "City Lights",
    videoUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-23258/",
  },
  {
    label: "Play",
    videoUrl: "https://cdn.pixabay.com/video/2024/03/03/202749-918944227_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2024/03/03/202749-918944227_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-202749/",
  },
];

const PARTNER_CLIPS: JourneyClip[] = [
  {
    label: "City Night",
    videoUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-23258/",
  },
  {
    label: "Movement",
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
];

const DROP_CLIPS: JourneyClip[] = [
  {
    label: "City",
    videoUrl: "https://cdn.pixabay.com/video/2020/09/19/50352-460423340_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2020/09/19/50352-460423340_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-50352/",
  },
  {
    label: "Mountains",
    videoUrl: "https://cdn.pixabay.com/video/2025/09/22/305657_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2025/09/22/305657_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-305657/",
  },
  {
    label: "Play",
    videoUrl: "https://cdn.pixabay.com/video/2024/03/03/202749-918944227_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2024/03/03/202749-918944227_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-202749/",
  },
];

const MARKET_CLIPS: JourneyClip[] = [
  {
    label: "Fields",
    videoUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-130226/",
  },
  {
    label: "Road",
    videoUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-800/",
  },
  {
    label: "City",
    videoUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-23258/",
  },
];

export function JourneyHero({
  variant = "home",
  eyebrow,
  title,
  accent,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  variant?: "home" | "market" | "partner" | "drops";
  eyebrow: string;
  title: string;
  accent: string;
  copy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const clips = useMemo(() => {
    if (variant === "market") return MARKET_CLIPS;
    if (variant === "partner") return PARTNER_CLIPS;
    if (variant === "drops") return DROP_CLIPS;
    return HOME_CLIPS;
  }, [variant]);
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
    }, 6500);
    return () => window.clearInterval(timer);
  }, [clips.length, reduceMotion]);

  const clip = clips[index];

  return (
    <section className="relative isolate min-h-[68svh] overflow-hidden bg-soil text-cream sm:min-h-[76svh]">
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,19,15,.93)_0%,rgba(18,19,15,.72)_42%,rgba(18,19,15,.28)_70%,rgba(18,19,15,.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(232,198,138,.18),transparent_28rem)]" />
      </div>

      <div className="relative mx-auto flex min-h-[68svh] max-w-7xl items-end px-4 pb-8 pt-16 sm:min-h-[76svh] sm:px-8 sm:py-14 lg:px-10 lg:py-20">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">{eyebrow}</p>
          <h1 className="mt-4 font-display text-[clamp(2.65rem,12vw,4.5rem)] font-black leading-[.93] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
            {title}<br /><span className="text-wheat">{accent}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cream/78 sm:text-lg">{copy}</p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <a href={primaryHref} className="btn-primary w-full justify-center !bg-wheat !text-soil hover:!bg-cream sm:w-auto">{primaryLabel}</a>
            {secondaryHref && secondaryLabel ? (
              <a href={secondaryHref} className="btn-ghost-light w-full justify-center sm:w-auto">{secondaryLabel}</a>
            ) : null}
          </div>

          <div className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {clips.map((item, itemIndex) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={
                  "min-h-11 shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition " +
                  (itemIndex === index
                    ? "border-wheat bg-wheat text-soil"
                    : "border-cream/20 bg-black/15 text-cream/70 hover:border-cream/40")
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
            className="mt-4 inline-block text-[10px] text-cream/45 underline underline-offset-2"
          >
            Background footage source: Pixabay
          </a>
        </div>
      </div>
    </section>
  );
}
