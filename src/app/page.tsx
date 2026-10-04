import { resolveCurrentPublicEra } from "@/lib/era-engine/resolver";
import { EraRenderer, NoCurrentEra } from "@/components/acre-era/era-renderer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const current = await resolveCurrentPublicEra();
    if (!current.ok) return <NoCurrentEra />;
    return <EraRenderer era={current.era} current />;
  } catch (error) {
    console.error("Current Era page resolution failed:", error);
    return <NoCurrentEra />;
  }
}
