'use client';

import { useState } from "react";
import Link from "next/link";
import { ACRE_ERA_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";

const CHAPTERS = [
  {
    key: "fresh",
    label: "Fresh",
    kicker: "Where the road begins",
    title: "Food with a place behind it.",
    copy: "Fields, local makers, seasonal food, and the everyday things that still feel connected to where they came from.",
    href: "/market",
    cta: "Enter Market",
    videoUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-130226/",
    overlay: "from-[#1f2e1d]/95 via-[#33452a]/78 to-[#7d7446]/52",
    productIds: [-102, -101],
  },
  {
    key: "everyday",
    label: "Everyday",
    kicker: "The trip keeps moving",
    title: "Real life fills the cart.",
    copy: "Pets, family, beauty, home, and repeat purchases belong here too. Useful can still feel considered.",
    href: "/shop",
    cta: "Shop Goods",
    videoUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2015/09/20/800-139832676_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-800/",
    overlay: "from-[#443a2d]/95 via-[#66503a]/80 to-[#b38a58]/48",
    productIds: [-103, -105],
  },
  {
    key: "city",
    label: "City",
    kicker: "Country gives way to motion",
    title: "Style and tech enter the picture.",
    copy: "The same customer buying dog treats and groceries can want headphones, travel gear, and a $150-plus pair of shoes.",
    href: "/partners",
    cta: "Explore Finds",
    videoUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2018/11/29/19627-304735769_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-19627/",
    overlay: "from-[#172027]/96 via-[#263847]/80 to-[#786e65]/48",
    productIds: [-106, -107],
  },
  {
    key: "after-dark",
    label: "After Dark",
    kicker: "The city lights come on",
    title: "Premium gets cinematic.",
    copy: "Limited finds, elevated accessories, and Era drops can feel luxurious without pretending the rest of life disappeared.",
    href: "/era-drops",
    cta: "See Era Drops",
    videoUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.mp4",
    posterUrl: "https://cdn.pixabay.com/video/2019/05/03/23258-334228230_medium.jpg",
    sourceUrl: "https://pixabay.com/videos/id-23258/",
    overlay: "from-[#11100f]/96 via-[#2b211e]/82 to-[#7b553b]/48",
    productIds: [-108, -110],
  },
] as const;

export function AcreEraJourneyStory() {
  const [index, setIndex] = useState(0);
  const chapter = CHAPTERS[index];
  const products = chapter.productIds
    .map((id) => ACRE_ERA_PREVIEW_PRODUCTS.find((product) => product.id === id))
    .filter(Boolean);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="overflow-hidden rounded-[2.2rem] bg-soil text-cream shadow-xl">
        <div className="relative min-h-[38rem]">
          <video
            key={chapter.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            poster={chapter.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={chapter.videoUrl} type="video/mp4" />
          </video>
          <div className={"absolute inset-0 bg-gradient-to-r " + chapter.overlay} />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,10,8,.72)_0%,transparent_50%)]" />

          <div className="relative grid min-h-[38rem] gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">{chapter.kicker}</p>
                <h2 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[.95] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                  {chapter.title}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-cream/78">{chapter.copy}</p>
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  {CHAPTERS.map((item, itemIndex) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      className={
                        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition " +
                        (itemIndex === index
                          ? "border-wheat bg-wheat text-soil"
                          : "border-cream/20 bg-black/20 text-cream/65 hover:border-cream/40")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Link href={chapter.href} className="btn-primary !bg-wheat !text-soil">
                    {chapter.cta}
                  </Link>
                  <a href={chapter.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-cream/38 underline underline-offset-2">
                    Footage source
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {products.map((product) =>
                  product ? (
                    <article key={product.id} className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-black/25 backdrop-blur-md">
                      <div className={"flex aspect-[5/3] items-center justify-center bg-gradient-to-br " + product.accent}>
                        <span className="text-6xl">{product.icon}</span>
                      </div>
                      <div className="p-5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-wheat">
                          {product.niche.replace("-", " ")}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-bold">{product.name}</h3>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-display text-lg font-bold">${product.price.toFixed(2)}</span>
                          <span className="text-[9px] uppercase tracking-[0.12em] text-cream/45">Preview</span>
                        </div>
                      </div>
                    </article>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
