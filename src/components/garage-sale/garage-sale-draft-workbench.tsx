"use client";

import { useState } from "react";
import {
  SAMPLE_BULK_ITEMS, GARAGE_SALE_EVENTS, parseGarageSaleDraft,
  markDraftItem, approvedDraftItems,
  type DraftItem,
} from "@/lib/garage-sale/drafts";

export function GarageSaleDraftWorkbench({ onItemsChange }: { onItemsChange?: (items: DraftItem[]) => void }) {
  const [raw, setRaw] = useState(SAMPLE_BULK_ITEMS);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const approved = approvedDraftItems(items);
  const total = approved.reduce((sum, item) => sum + item.price, 0);

  function review() {
    const result = parseGarageSaleDraft(raw);
    setItems(result.items);
    onItemsChange?.(result.items);
    setIssues(result.errors);
    setReviewed(true);
  }
  function reset() {
    setRaw(SAMPLE_BULK_ITEMS);
    setItems([]);
    onItemsChange?.([]);
    setIssues([]);
    setReviewed(false);
  }

  return (
    <section className="rounded-[2rem] border border-soil/10 bg-cream p-6 md:p-9" aria-labelledby="garage-draft-heading">
      <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-leaf">Seller studio · fictional preview</p>
          <h2 id="garage-draft-heading" className="mt-3 font-display text-3xl font-black">Prepare the whole sale in one go.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Paste sample items as name | category | price | condition, one per line. Review and explicitly approve each item.
            Nothing is uploaded, stored, sent to a seller or published.
          </p>
          <label htmlFor="garage-bulk-lines" className="mt-5 block text-sm font-semibold">Bulk item drafts</label>
          <textarea id="garage-bulk-lines" rows={6} maxLength={15000} value={raw}
            onChange={event => { setRaw(event.target.value); setReviewed(false); setItems([]); onItemsChange?.([]); setIssues([]); }}
            className="mt-2 w-full rounded-xl border border-soil/20 bg-bone p-4 font-mono text-sm"
            spellCheck={false} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={review} type="button" className="rounded-xl bg-leaf px-5 py-3 text-sm font-bold text-white">Review items</button>
            <button onClick={reset} type="button" className="rounded-xl border border-soil/20 px-5 py-3 text-sm font-semibold">Reset fictional sample</button>
          </div>
          <p className="mt-3 text-xs text-muted">Valid conditions: New, Used - like new, Used - good, Used - fair, For parts. Up to 40 lines of valid items. Photos can be linked to approved items below in the browser-only demo.</p>
          {issues.length > 0 && <div role="alert" className="mt-4 rounded-xl border border-amber-300/30 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">{issues.length} review note{issues.length === 1 ? "" : "s"}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">{issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
          </div>}
        </div>
        <aside className="rounded-2xl bg-sage-wash p-6">
          <h3 className="font-display text-2xl font-bold">Seller approval queue</h3>
          <p className="mt-2 text-sm text-muted">
            {reviewed ? `${items.length} valid draft items · ${approved.length} selected for fictional approval` : "Review the sample lines to generate an approval queue."}
          </p>
          <div className="mt-4 space-y-2">
            {items.map(item => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream p-3 text-sm">
                <input type="checkbox" checked={item.approved} onChange={event => { const next = markDraftItem(items, item.id, event.target.checked); setItems(next); onItemsChange?.(next); }}
                  className="mt-1 h-4 w-4 accent-leaf" />
                <span className="flex-1"><strong className="block">{item.name}</strong>
                  <span className="text-xs text-muted">{item.category} · {item.condition}</span>
                </span>
                <span className="font-semibold">${item.price.toFixed(2)}</span>
              </label>
            ))}
          </div>
          <p role="status" className="mt-4 rounded-xl bg-cream p-4 text-sm">
            <strong>{approved.length} locally approved</strong> · Sample subtotal ${total.toFixed(2)}
            <span className="mt-1 block text-xs text-muted">Approval is a local preview state only. There is no publish action.</span>
          </p>
        </aside>
      </div>
      <div className="mt-8 border-t border-soil/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-leaf">Neighborhood sale events · fictional</p>
        {GARAGE_SALE_EVENTS.map(event => (
          <article key={event.id} className="mt-3 rounded-2xl bg-sage-wash p-5">
            <h3 className="font-display text-xl font-bold">{event.name}</h3>
            <p className="mt-2 text-sm text-muted">{event.neighborhood} · {event.schedule}</p>
            <p className="mt-2 text-xs text-muted">{event.saleIds.length} connected demo storefronts · No actual host, event booking or physical address.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
