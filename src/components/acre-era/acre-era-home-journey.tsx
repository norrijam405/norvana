'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ACRE_ERA_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";

const SCENES = [
  {
    key: "fresh",
    tab: "Fresh Era",
    eyebrow: "Fresh living",
    title: "From open roads",
    accent: "to the table.",
    copy: "Seasonal food, local producers, and everyday essentials start the trip close to home.",
    href: "/market",
    cta: "Shop Market",
    videoUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-130226/",
    overlay: "from-[#172416]/95 via-[#32452a]/75 to-[#87794a]/40",
    ids: [-102, -101],
  },
  {
    key: "everyday",
    tab: "Everyday Era",
    eyebrow: "Real life",
    title: "The road keeps moving",
    accent: "and the cart fills up.",
    copy: "Pets, family, beauty, home, and repeat buys belong in the same life as fresh food.",
    href: "/shop",
    cta: "Shop Goods",
    videoUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-800/",
    overlay: "from-[#3b3025]/96 via-[#684c35]/75 to-[#b88755]/38",
    ids: [-103, -105],
  },
  {
    key: "city",
    tab: "City Era",
    eyebrow: "City energy",
    title: "Same customer",
    accent: "different mood.",
    copy: "Tech, travel, style, and a $150-plus pair of shoes do not belong to a different person.",
    href: "/partners",
    cta: "Explore Finds",
    videoUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-19627/",
    overlay: "from-[#121b22]/96 via-[#263a49]/74 to-[#746d66]/36",
    ids: [-106, -107],
  },
  {
    key: "after-dark",
    tab: "After Dark Era",
    eyebrow: "Premium + limited",
    title: "When the lights come on",
    accent: "the world changes.",
    copy: "Premium accessories and Era drops get cinematic without turning the rest of Acre Era into a costume.",
    href: "/era-drops",
    cta: "Enter Era Drops",
    videoUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-23258/",
    overlay: "from-[#0d0c0b]/97 via-[#2d211d]/78 to-[#80573d]/38",
    ids: [-108, -110],
  },
] as const;

export function AcreEraHomeJourney({ showPreviewProducts }: { showPreviewProducts: boolean }) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const scene = SCENES[index];

  const products = useMemo(
    () =>
      scene.ids
        .map((id) => ACRE_ERA_PREVIEW_PRODUCTS.find((product) => product.id === id))
        .filter(Boolean),
    [scene.ids]
  );

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
      setIndex((value) => (value + 1) % SCENES.length);
    }, 7600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <section className="relative isolate min-h-[84svh] overflow-hidden bg-soil text-cream">
      <div className="absolute inset-0">
        {reduceMotion ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${scene.posterUrl}")` }}
            role="img"
            aria-label={scene.tab}
          />
        ) : (
          <video
            key={scene.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            poster={scene.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={scene.videoUrl} type="video/mp4" />
          </video>
        )}
        <div className={"absolute inset-0 bg-gradient-to-r " + scene.overlay} />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,7,.82)_0%,transparent_48%,rgba(8,8,7,.18)_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-[84svh] max-w-7xl gap-8 px-5 pb-8 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:px-10 lg:pb-12 lg:pt-16">
        <div className="flex min-h-[36rem] flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-wheat/25 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-wheat">
                Acre Era
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-cream/45">
                choose the Era that fits your moment
              </span>
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-wheat">{scene.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[.92] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
              {scene.title}<br />
              <span className="text-wheat">{scene.accent}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/76 sm:text-lg">{scene.copy}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={scene.href} className="btn-primary !bg-wheat !text-soil hover:!bg-cream">
                {scene.cta}
              </Link>
              <Link href="/shop" className="btn-ghost-light">
                Shop all Acre Era
              </Link>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap gap-2">
              {SCENES.map((item, itemIndex) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={
                    "rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition " +
                    (itemIndex === index
                      ? "border-wheat bg-wheat text-soil"
                      : "border-cream/20 bg-black/20 text-cream/62 hover:border-cream/40")
                  }
                >
                  {item.tab}
                </button>
              ))}
            </div>
            <a
              href={scene.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-[9px] text-cream/35 underline underline-offset-2"
            >
              Background footage source
            </a>
          </div>
        </div>

        <div className="flex items-end">
          {showPreviewProducts ? (
            <div className="w-full">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/45">
                In this Era
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) =>
                  product ? (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-[1.45rem] border border-white/12 bg-black/28 shadow-lg backdrop-blur-md"
                    >
                      <div className={"flex aspect-[5/3] items-center justify-center bg-gradient-to-br " + product.accent}>
                        <span className="text-6xl drop-shadow-sm">{product.icon}</span>
                      </div>
                      <div className="p-5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-wheat">
                          {product.niche.replace("-", " ")}
                        </p>
                        <h2 className="mt-2 font-display text-xl font-bold">{product.name}</h2>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-cream/55">{product.description}</p>
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <span className="font-display text-lg font-bold">${product.price.toFixed(2)}</span>
                          <span className="text-[9px] uppercase tracking-[0.12em] text-cream/38">Preview</span>
                        </div>
                      </div>
                    </article>
                  ) : null
                )}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-[1.6rem] border border-white/12 bg-black/25 p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wheat">One world, many moods</p>
              <p className="mt-3 text-sm leading-7 text-cream/62">
                Fresh food, everyday goods, style, tech, and premium finds can live in one place while each Era keeps its own mood.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
