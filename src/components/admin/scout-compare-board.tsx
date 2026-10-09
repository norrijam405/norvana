"use client";

import { useMemo, useState } from "react";

export type ScoutCompareItem = {
  id: number;
  title: string;
  lane: string;
  source: string;
  truthState: string;
  projected: string | null;
  margin: string | null;
  salePrice: string | null;
  productCost: string | null;
  shipping: string | null;
  confidence: number | null;
  riskCount: number;
  why: string;
  whyNow: string;
};

export function ScoutCompareBoard({ items }: { items: ScoutCompareItem[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const chosen = useMemo(
    () => selected.map((id) => items.find((item) => item.id === id)).filter(Boolean) as ScoutCompareItem[],
    [items, selected]
  );

  function toggle(id: number) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  return (
    <section className="mt-6 rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Compare picks</p>
          <h3 className="mt-2 font-display text-2xl font-bold">Put up to three products on the same desk.</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Compare the money case, confidence, risk count, and Scout reasoning before you place anything.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
          {selected.length} / 3 selected
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={
                "min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition " +
                (active
                  ? "border-indigo-300/35 bg-indigo-300/10 text-indigo-100"
                  : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.06]")
              }
            >
              {active ? "✓ " : "+ "}
              {item.title}
            </button>
          );
        })}
      </div>

      {chosen.length >= 2 ? (
        <div className="mt-5 overflow-x-auto">
          <div className="grid min-w-[46rem] gap-3" style={{ gridTemplateColumns: `repeat(${chosen.length}, minmax(0, 1fr))` }}>
            {chosen.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
                  {item.lane} · {item.truthState}
                </p>
                <h4 className="mt-2 font-display text-lg font-bold">{item.title}</h4>
                <p className="mt-1 text-[11px] text-white/35">{item.source}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-emerald-300/[0.06] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-emerald-100/50">Projected</p>
                    <p className="mt-1 font-semibold text-emerald-100">{item.projected || "Pending"}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Margin</p>
                    <p className="mt-1 font-semibold text-white/70">{item.margin || "Pending"}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Sell / cost</p>
                    <p className="mt-1 text-white/65">{item.salePrice || "?"} / {item.productCost || "?"}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Confidence / risks</p>
                    <p className="mt-1 text-white/65">
                      {item.confidence === null ? "?" : `${item.confidence}%`} / {item.riskCount}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-wheat/70">Why now?</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{item.whyNow}</p>
                </div>
                <div className="mt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-200/70">Why Scout likes it</p>
                  <p className="mt-1 line-clamp-4 text-xs leading-5 text-white/45">{item.why}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/30">Pick at least two products to compare.</p>
      )}
    </section>
  );
}
