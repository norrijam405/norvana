import { notFound } from "next/navigation";
import { resolvePublicEraBySlug } from "@/lib/era-engine/resolver";
import { EraRenderer } from "@/components/acre-era/era-renderer";

export const dynamic = "force-dynamic";

export default async function EraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const era = await resolvePublicEraBySlug(slug);
    if (!era) notFound();
    return <EraRenderer era={era} />;
  } catch (error) {
    console.error("Era page resolution failed:", error);
    notFound();
  }
}
