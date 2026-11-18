import type { Metadata } from "next";
import Link from "next/link";
import { SafetyCoverageExplorer } from "@/components/acre-era/safety-coverage-explorer";
import { Footer } from "@/components/footer";
export const metadata: Metadata = {
  title:"Safety across Acre Era — planning preview",
  description:"Explore safety considerations for garage sales, farms, goods, affiliates, Era Drops, delivery and communication. Not a live safety monitoring service.",
  robots: { index:false, follow:false },
};
export default function SafetyPage() {
  return <>
    <main className="min-h-screen bg-bone text-soil">
      <section className="bg-soil px-4 py-14 text-cream sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-wheat">Acre Era · Safety experience R0</p>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">Safer decisions across every Era.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-cream/75">A practical look at how Acre Era and IgniAqua's planned SafeSpot service can protect different customer journeys. No claims of verified safety or operational monitoring.</p>
          <Link href="/garage-sale" className="mt-6 inline-block text-sm font-bold text-cream underline underline-offset-4">Explore fictional Garage Sale</Link>
        </div>
      </section>
      <SafetyCoverageExplorer />
    </main>
    <Footer />
  </>;
}
