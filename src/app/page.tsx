import { resolveCurrentPublicEra } from "@/lib/era-engine/resolver";
import { EraRenderer, NoCurrentEra } from "@/components/acre-era/era-renderer";
import type { PublicEraMedia } from "@/lib/era-engine/types";

export const dynamic = "force-dynamic";

const PREVIEW_BETWEEN_ERAS_MEDIA: PublicEraMedia[] =
  process.env.VERCEL_ENV === "preview"
    ? [
        {
          id: -130226,
          assetType: "HERO_VIDEO",
          mediaUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.mp4",
          posterUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg",
          altText: "Green leafy vegetables growing in a field",
          brandName: null,
          providerSlug: "pixabay",
        },
      ]
    : [];

export default async function HomePage() {
  try {
    const current = await resolveCurrentPublicEra();
    if (!current.ok) return <NoCurrentEra previewMedia={PREVIEW_BETWEEN_ERAS_MEDIA} />;
    return <EraRenderer era={current.era} current />;
  } catch (error) {
    console.error("Current Era page resolution failed:", error);
    return <NoCurrentEra previewMedia={PREVIEW_BETWEEN_ERAS_MEDIA} />;
  }
}
