"use client";

import { useState } from "react";
import {
  ACRE_SAFETY_CONTEXTS, coverageByContext, evaluateSyntheticAcreSafety,
  type AcreSafetyContext,
} from "@/lib/acre-era/safety-coverage";

const DISPLAY: Record<AcreSafetyContext, string> = {
  GARAGE_SALE:"Garage Sale", MARKET_FARM:"Market & farms", GOODS:"Goods Era",
  FINDS_AFFILIATE:"Finds & affiliates", ERA_DROP:"Era Drop",
  PICKUP_DELIVERY:"Pickup & delivery", BUYER_SELLER_CHAT:"Buyer–seller chat",
};
export function SafetyCoverageExplorer() {
  const [context, setContext] = useState<AcreSafetyContext>("GARAGE_SALE");
  const [flags, setFlags] = useState({ offPlatform:false, address:false });
  const domains = coverageByContext(context);
  const assessment = evaluateSyntheticAcreSafety({
    context, requestingOffPlatformPayment:flags.offPlatform, containsPrivateAddress:flags.address,
  });
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div role="status" className="rounded-2xl border border-amber-500/20 bg-amber-50 p-4 text-sm text-soil">
      <strong>Safety planning Preview · not a live safety service.</strong> No account, official location, payment, seller, product, shipment or incident is checked here. This page gives general precautions and shows synthetic review requirements.
    </div>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_.85fr]">
      <div>
        <label htmlFor="acre-safety-area" className="block text-sm font-semibold">Choose an Acre Era experience</label>
        <select id="acre-safety-area" value={context} onChange={event => setContext(event.target.value as AcreSafetyContext)}
          className="mt-2 w-full rounded-xl border border-soil/20 bg-cream px-4 py-3">
          {ACRE_SAFETY_CONTEXTS.map(id => <option key={id} value={id}>{DISPLAY[id]}</option>)}
        </select>
        <h2 className="mt-7 font-display text-2xl font-bold">{DISPLAY[context]} · coverage areas</h2>
        <p className="mt-2 text-sm text-muted">{domains.length} distinct protection areas mapped to this experience. None is a statement that operational safeguards have been verified.</p>
        <div className="mt-5 grid gap-4">
          {domains.map(domain => <article key={domain.id} className="rounded-2xl border border-soil/10 bg-cream p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold">{domain.title}</h3>
              <span className="rounded-full bg-sage-wash px-3 py-1 text-xs font-semibold">Owner: {domain.accountableOwner.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-3 text-sm leading-6">{domain.customerAdvice}</p>
            <details className="mt-3 text-xs text-muted"><summary className="cursor-pointer font-semibold">What must be verified before release?</summary><p className="mt-2 leading-5">{domain.releaseGate}</p></details>
          </article>)}
        </div>
      </div>
      <aside className="h-fit rounded-[1.5rem] border border-soil/10 bg-cream p-6">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-leaf">Synthetic safety challenge</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Practice spotting risks</h2>
        <p className="mt-3 text-sm text-muted">Toggle fictional risk signals to see why a transaction would need review. Nothing is submitted, scored against a person, or treated as a real threat.</p>
        <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={flags.offPlatform} onChange={event=>setFlags(previous=>({...previous,offPlatform:event.target.checked}))} className="mt-1 accent-leaf"/> Fictional seller asks for off-platform payment</label>
        <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={flags.address} onChange={event=>setFlags(previous=>({...previous,address:event.target.checked}))} className="mt-1 accent-leaf"/> Fictional listing exposes a private address</label>
        <div aria-live="polite" className="mt-6 rounded-xl bg-sage-wash p-4">
          <p className="font-semibold">Review required · not cleared for release</p>
          <p className="mt-2 text-xs text-muted">The simulation always fails closed, including when no warning is selected.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {assessment.flags.map(flag=><li key={flag}>{flag}</li>)}
          </ul>
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">Immediate danger: contact local emergency services. This prototype does not receive alerts or incident reports.</p>
      </aside>
    </div>
  </section>;
}
