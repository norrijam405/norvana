"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  {
    sku: "CJSJ228498801AZ",
    name: "Desktop Folding Full-Alloy Phone Holder",
    priority: "1",
    reason: "Small, simple, low unit cost, low expected support burden.",
  },
  {
    sku: "CJSJ206576301AZ",
    name: "Metal Rotating Folding Phone Bracket",
    priority: "2",
    reason: "Useful desk product with clear demo value and modest unit cost.",
  },
  {
    sku: "CJYD197888501AZ",
    name: "Magnetic Cable Organizer",
    priority: "3",
    reason: "Everyday tech/home utility; qualify one exact light variant only.",
  },
  {
    sku: "CJJT174982701AZ",
    name: "Portable Washable Pet Hair Roller",
    priority: "4",
    reason: "Evergreen pet problem, reusable, strong before/after demo.",
  },
  {
    sku: "CJMY200580801AZ",
    name: "2-in-1 Pet Hair Removal Roller",
    priority: "5",
    reason: "Simple pet/home candidate with no batteries or electronics.",
  },
];

const STORAGE_KEY = "acre-era-cj-route-check-r0";

export function CjRouteCheckPanel() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, []);

  function toggle(sku: string) {
    setChecked((current) => {
      const next = { ...current, [sku]: !current[sku] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const done = ITEMS.filter((item) => checked[item.sku]).length;

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">CJ route check</p>
          <h2 className="mt-2 font-display text-3xl font-black">Only these five need you.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
            Scout already narrowed the catalog. For each SKU, open CJ while signed in and verify the U.S. route.
            We need current stock, processing time, delivery window, and shipping cost. A public-page $0.00 shipping value does not count.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] px-5 py-4 text-right">
          <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/55">Checked</p>
          <p className="mt-1 font-display text-3xl font-black text-emerald-100">{done} / {ITEMS.length}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {ITEMS.map((item) => (
          <article key={item.sku} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <label className="mt-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <input
                  type="checkbox"
                  checked={Boolean(checked[item.sku])}
                  onChange={() => toggle(item.sku)}
                  className="h-5 w-5"
                />
              </label>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Priority {item.priority}
                  </span>
                  <code className="text-[11px] text-indigo-200">{item.sku}</code>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{item.name}</h3>
                <p className="mt-1 text-xs leading-5 text-white/45">{item.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Stock", "Processing", "Delivery", "Shipping cost"].map((field) => (
                    <span key={field} className="rounded-full border border-amber-300/10 bg-amber-300/[0.04] px-2.5 py-1 text-[10px] text-amber-100/65">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold text-white/70">What counts as complete?</p>
        <p className="mt-2 text-xs leading-5 text-white/40">
          One exact variant, ship-to U.S., visible inventory state, processing estimate, delivery estimate, and calculated shipping cost.
          Do not import, connect the store, place an order, or enable fulfillment just to get this information.
        </p>
      </div>
    </section>
  );
}
