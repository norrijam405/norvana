'use client';

import { useEffect, useState } from "react";
import type { PublicEraMedia } from "@/lib/era-engine/types";

function isVideo(asset: PublicEraMedia) {
  return asset.assetType.toUpperCase().includes("VIDEO");
}

export function EraHeroMedia({ media, eraName }: { media: PublicEraMedia[]; eraName: string }) {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const hero =
    media.find((asset) => asset.assetType.toUpperCase().includes("HERO")) ??
    media[0] ??
    null;

  if (!hero) {
    return (
      <div
        className="absolute inset-0 acre-era-hero-fallback"
        role="img"
        aria-label={`${eraName} visual backdrop`}
      />
    );
  }

  if (isVideo(hero) && !reduceMotion) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        poster={hero.posterUrl ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={hero.altText || `${eraName} hero video`}
      >
        <source src={hero.mediaUrl} />
      </video>
    );
  }

  const still = hero.posterUrl || (!isVideo(hero) ? hero.mediaUrl : null);
  if (!still) {
    return (
      <div
        className="absolute inset-0 acre-era-hero-fallback"
        role="img"
        aria-label={hero.altText || `${eraName} visual backdrop`}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      role="img"
      aria-label={hero.altText || `${eraName} hero image`}
      style={{ backgroundImage: `url("${still.replaceAll('"', "%22")}")` }}
    />
  );
}
