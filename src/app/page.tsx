import { resolveCurrentPublicEra } from "@/lib/era-engine/resolver";
import { EraRenderer } from "@/components/acre-era/era-renderer";
import { BetweenErasHome } from "@/components/acre-era/between-eras-home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const current = await resolveCurrentPublicEra();
    if (!current.ok) return <BetweenErasHome />;
    return <EraRenderer era={current.era} current />;
  } catch (error) {
    console.error("Current Era page resolution failed:", error);
    return <BetweenErasHome />;
  }
}
