import Link from "next/link";
export const metadata={title:"Featured Producers | Acre Era",description:"Discover Acre Era's producer spotlight program for independent farms, makers and local shops."};
export default function FeaturedProducersPage(){
 return <main className="min-h-screen bg-[#f8f5ec] px-5 py-16 text-stone-900"><div className="mx-auto max-w-5xl">
 <Link href="/" className="text-sm font-semibold underline">← Acre Era</Link>
 <p className="mt-12 text-xs font-bold uppercase tracking-[.2em] text-amber-800">Acre Era · Local stories</p>
 <h1 className="mt-3 max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">The people behind the products.</h1>
 <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">We're building a space to discover independent farms, ranches, food makers, artisans and neighborhood businesses. Every producer spotlight will be reviewed before publication.</p>
 <section className="mt-12 grid gap-4 md:grid-cols-3">
 {([{title:"Producer stories",text:"Learn where products originate, who makes them and why their work matters."},{title:"Regional discovery",text:"Explore local makers and the communities they serve as verified profiles become available."},{title:"Clear partnerships",text:"Sponsored placements will be clearly identified. A paid feature is not a claim of independent endorsement."}]).map(x=><article key={x.title} className="rounded-2xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-bold">{x.title}</h2><p className="mt-3 text-sm leading-6 text-stone-600">{x.text}</p></article>)}
 </section>
 <section className="mt-12 rounded-3xl bg-stone-900 p-8 text-white"><h2 className="text-2xl font-bold">Are you an independent producer?</h2><p className="mt-3 max-w-2xl leading-7 text-stone-300">Introduce your business for consideration. Applying does not guarantee a listing, promotion or sales relationship. No advertising purchase is required to apply.</p><Link href="/become-a-partner" className="mt-6 inline-block rounded-xl bg-amber-300 px-6 py-3 font-bold text-stone-950">Introduce your business</Link></section>
 <p className="mt-8 text-sm text-stone-600">Profiles and commercial sponsorships are in preparation. We do not currently sell alcohol, arrange alcohol delivery, or offer paid alcohol placements through this program.</p>
 </div></main>;
}