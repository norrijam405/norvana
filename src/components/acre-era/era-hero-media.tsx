'use client';

import { useEffect, useMemo, useState } from "react";
import type { PublicEraMedia } from "@/lib/era-engine/types";

type EraMotionProfile = "organic" | "kinetic" | "cinematic" | "precision";

function isVideo(asset: PublicEraMedia) {
  return asset.assetType.toUpperCase().includes("VIDEO");
}

function rank(asset: PublicEraMedia) {
  const type = asset.assetType.toUpperCase();
  if (type === "HERO_VIDEO") return 0;
  if (type === "HERO_IMAGE") return 1;
  if (type === "POSTER") return 2;
  if (type === "EDITORIAL_VIDEO") return 3;
  if (type === "CARD_IMAGE") return 4;
  return 5;
}

function HeroFallback({
  eraName,
  profile,
}: {
  eraName: string;
  profile: EraMotionProfile;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      role="img"
      aria-label={`${eraName} visual backdrop`}
    >
      <div className="absolute inset-0 acre-era-hero-fallback" data-era-motion={profile} />
      <div className="era-fallback-orb era-fallback-orb-a" aria-hidden="true" />
      <div className="era-fallback-orb era-fallback-orb-b" aria-hidden="true" />
      <div className="era-fallback-linework absolute inset-0" data-era-motion={profile} aria-hidden="true" />
    </div>
  );
}

export function EraHeroMedia({
  media,
  eraName,
  profile,
}: {
  media: PublicEraMedia[];
  eraName: string;
  profile: EraMotionProfile;
}) {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const ordered = useMemo(
    () => [...media].sort((a, b) => rank(a) - rank(b)),
    [media]
  );

  const hero = ordered[0] ?? null;

  if (!hero) {
    return <HeroFallback eraName={eraName} profile={profile} />;
  }

  if (isVideo(hero) && !reduceMotion) {
    return (
      <>
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
        <div className="absolute inset-0 bg-black/5" aria-hidden="true" />
      </>
    );
  }

  const still =
    hero.posterUrl ||
    (!isVideo(hero) ? hero.mediaUrl : null) ||
    ordered.find((asset) => !isVideo(asset))?.mediaUrl ||
    null;

  if (!still) {
    return <HeroFallback eraName={eraName} profile={profile} />;
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
