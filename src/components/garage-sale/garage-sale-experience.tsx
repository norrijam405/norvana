"use client";

import Link from "next/link";
import { useState } from "react";
import { GarageSaleDemo } from "@/components/garage-sale/garage-sale-demo";
import { SellerStudio } from "@/components/garage-sale/seller-studio";
import { MessagePreviewWorkbench } from "@/components/garage-sale/message-preview-workbench";
import { GARAGE_SALE_JOURNEYS, type GarageSaleJourney } from "@/lib/garage-sale/experience";
import type { SafeSpotAdapterResponse } from "@/lib/garage-sale/safespot-fixtures";

/**
 * Customer-first presentation of existing features. No route/network changes,
 * and the seller studio continues to be local, fictional and nonpublishing.
 */
export function GarageSaleExperience({ safeSpots }: { safeSpots: SafeSpotAdapterResponse }) {
  const [journey, setJourney] = useState<GarageSaleJourney>("BUY");
  return <div className="bg-bone text-soil">
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-2" role="group" aria-label="Explore Garage Sale as a shopper or seller">
        {GARAGE_SALE_JOURNEYS.map((option, i) => {
          const active = journey === option.id;
          return <button key={option.id} type="button" aria-pressed={active}
            onClick={() => setJourney(option.id)}
            className={"group flex min-h-[13rem] flex-col items-start justify-between rounded-[1.8rem] border p-6 text-left transition duration-200 hover:-translate-y-0.5 md:p-8 " +
              (active ? "border-leaf bg-[#e3e9d9] ring-2 ring-leaf/20" : "border-soil/10 bg-cream hover:border-leaf/40")}>
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[.2em] text-leaf">{option.eyebrow}</span>
              <span aria-hidden="true" className="text-xl font-semibold text-soil/50">{i === 0 ? "↗" : "✦"}</span>
            </div>
            <div className="mt-7">
              <h2 className="font-display text-3xl font-bold tracking-tight">{option.label}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-soil/65">{option.description}</p>
              <span className="mt-5 inline-block border-b border-soil/40 pb-1 text-sm font-bold">{option.action}</span>
            </div>
          </button>;
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#263428] px-5 py-4 text-sm text-cream sm:px-6">
        <p><strong>Explore safely.</strong> All sales, sellers, offers and meetup points on this page are fictional.</p>
        <Link href="/safety" className="font-semibold text-wheat underline underline-offset-4">How Acre Era approaches safety</Link>
      </div>
    </div>
    {journey === "BUY" ?
      <div id="garage-buyer-experience" aria-label="Fictional shopping experience">
        <GarageSaleDemo safeSpots={safeSpots} />
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <MessagePreviewWorkbench />
        </div>
      </div>
      :
      <div id="garage-seller-experience" aria-label="Fictional seller studio" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SellerStudio />
      </div>}
  </div>;
}
