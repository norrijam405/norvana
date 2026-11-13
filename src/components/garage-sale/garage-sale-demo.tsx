"use client";

import { useState } from "react";
import { GARAGE_SALE_FIXTURES, bundleTotal } from "@/lib/garage-sale/fixtures";
import type { SafeSpotAdapterResponse } from "@/lib/garage-sale/safespot-fixtures";

export function GarageSaleDemo({ safeSpots }: { safeSpots: SafeSpotAdapterResponse }) {
  const [saleId, setSaleId] = useState(GARAGE_SALE_FIXTURES[0].id);
  const [selected, setSelected] = useState<string[]>([]);
  const [chosenVenue, setChosenVenue] = useState("");
  const [offer, setOffer] = useState("");
  const sale = GARAGE_SALE_FIXTURES.find((entry) => entry.id === saleId) ?? GARAGE_SALE_FIXTURES[0];
  const total = bundleTotal(sale, selected);
  const proposedOffer = Number(offer);
  const validOffer = selected.length > 0 && offer.trim() !== "" && Number.isFinite(proposedOffer) && proposedOffer > 0 && proposedOffer <= 100000;
  const venue = safeSpots.options.find((option) => option.id === chosenVenue);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div role="status" className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-soil">
        <strong>Fictional prototype · no actual selling or safety verification.</strong> Every seller, listing, price, neighborhood, pickup option and location below is invented. Nothing here accepts orders, messages, payment or reservations.
      </div>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Choose a fictional garage sale">
        {GARAGE_SALE_FIXTURES.map((entry) => (
          <button key={entry.id} type="button" onClick={() => { setSaleId(entry.id); setSelected([]); setChosenVenue(""); setOffer(""); }}
            aria-pressed={entry.id === sale.id}
            className={"rounded-full border px-5 py-3 text-sm font-semibold " + (entry.id === sale.id ? "border-leaf bg-leaf text-white" : "border-soil/20 bg-cream text-soil")}>
            {entry.headline}
          </button>
        ))}
      </div>
      <section className="rounded-[2rem] bg-soil p-7 text-cream md:p-10">
        <p className="text-xs uppercase tracking-[.2em] text-wheat">{sale.sellerLabel} · Entire sale</p>
        <h2 className="mt-3 font-display text-4xl font-black">{sale.headline}</h2>
        <p className="mt-3 text-cream/70">{sale.story}</p>
        <p className="mt-4 text-sm text-cream/65">{sale.neighborhood} · {sale.schedule}</p>
        <p className="mt-3 text-xs text-wheat">No seller address or precise pickup coordinates are shown.</p>
      </section>
      <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
        <section aria-label="Fictional sale items">
          <div className="flex items-end justify-between gap-3">
            <h3 className="font-display text-2xl font-bold">Browse the whole sale</h3>
            <p className="text-xs text-muted">{sale.items.length} sample items</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {sale.items.map((item) => {
              const checked = selected.includes(item.id);
              return <label key={item.id} className={"cursor-pointer rounded-2xl border bg-cream p-5 " + (checked ? "border-leaf" : "border-soil/10")}>
                <div className="flex h-28 items-center justify-center rounded-xl bg-sage-wash text-sm font-medium text-muted">Photo pending · fictional</div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-widest text-leaf">{item.category}</p><h4 className="mt-1 font-semibold">{item.name}</h4></div>
                  <span className="font-bold">${item.price.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.condition} · {item.note}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={checked} onChange={() => setSelected((prev) => checked ? prev.filter((id) => id !== item.id) : [...prev, item.id])}
                    className="h-4 w-4 accent-leaf" />
                  Include in sample bundle
                </div>
              </label>;
            })}
          </div>
        </section>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-soil/10 bg-cream p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Bundle builder · demo only</p>
            <h3 className="mt-2 font-display text-2xl font-bold">{selected.length} items selected</h3>
            <p className="mt-2 text-lg">Listed total: <strong>${total.toFixed(2)}</strong></p>
            <label htmlFor="garage-offer" className="mt-4 block text-sm font-medium">Propose a fictional bundle offer ($)</label>
            <input id="garage-offer" type="number" inputMode="decimal" min="0.01" max="100000" step="0.01" value={offer} onChange={(event) => setOffer(event.target.value)}
              placeholder="Enter your proposed amount" className="mt-2 w-full rounded-xl border border-soil/20 bg-bone px-4 py-3" />
            <div role="status" className="mt-4 rounded-xl bg-sage-wash p-3 text-sm">
              {validOffer ? `Example only: offer of $${proposedOffer.toFixed(2)} for ${selected.length} items. Not submitted.` : "Select items and enter an offer to see a sample proposal. No offer is sent."}
            </div>
            <p className="mt-3 text-xs text-muted">Real negotiation requires private messaging, abuse controls and seller approval before launch.</p>
          </section>
          <section className="rounded-2xl border border-soil/10 bg-cream p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-leaf">SafeSpot · proposed integration</p>
            <h3 className="mt-2 font-display text-xl font-bold">Plan an exchange location</h3>
            <p className="mt-2 text-sm text-muted">IgniAqua will own verified exchange-place evidence. These options are fictional and not recommendations.</p>
            <label htmlFor="garage-venue" className="mt-4 block text-sm font-medium">Explore fictional location choices</label>
            <select id="garage-venue" value={chosenVenue} onChange={(event) => setChosenVenue(event.target.value)}
              className="mt-2 w-full rounded-xl border border-soil/20 bg-bone px-4 py-3">
              <option value="">Choose an example</option>
              {safeSpots.options.map((option) => <option key={option.id} value={option.id}>{option.displayName}</option>)}
            </select>
            {venue ? <div role="status" className="mt-3 rounded-xl bg-sage-wash p-3 text-sm">
              <p className="font-semibold">{venue.displayName} · {venue.regionLabel}</p>
              <p className="mt-1">Official exchange designation: {venue.attributes.designatedExchangeZone.state}</p>
              <p>Lighting: {venue.attributes.lighting.state} · Hours: {venue.attributes.accessHours.state}</p>
              <p className="mt-2 text-xs">No verified venue address, operating hours or safety certification. Pickup cannot be booked.</p>
            </div> : null}
            <p className="mt-4 text-xs text-muted">Never share a private home address by default. Independently confirm any real venue and its opening hours before arranging a meetup.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
