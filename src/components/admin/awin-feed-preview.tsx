"use client";
import { useState } from "react";
type Candidate = { productId: string; name: string; merchantName: string; price: number; currency: string; category: string; productUrl: string; availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"; eligibleForReview: boolean; reviewReasons: string[]; };
type Preview = { totalRows: number; candidateCount: number; rejectedCount: number; candidates: Candidate[]; disclaimer: string; imported: false; staged: false; published: false; };
export function AwinFeedPreview() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [preview, setPreview] = useState<Preview | null>(null);
  async function handleFile(file?: File) {
    if (!file) return; setPreview(null); setMessage("");
    if (!file.name.toLowerCase().endsWith(".csv")) { setMessage("Choose the CSV file downloaded from Awin. Do not paste a feed URL or API key."); return; }
    if (file.size > 2_000_000) { setMessage("This file is over 2 MB. Filter the feed in Awin and export a smaller selection."); return; }
    setBusy(true);
    try {
      const csvText = await file.text();
      const response = await fetch("/api/admin/awin/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csvText }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Awin feed preview failed.");
      setPreview(body as Preview);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Awin feed preview failed."); }
    finally { setBusy(false); }
  }
  return <section id="awin-feed-intake" className="mt-6 rounded-[2rem] border border-emerald-300/15 bg-white/[0.035] p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Affiliate inventory · Awin</p>
      <h2 className="mt-2 font-display text-2xl font-black">Bring real products into Finds</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Upload a filtered Awin product-feed CSV. We inspect merchant, product identity, price, USD currency, tracking links, and stock flags before anything enters the catalog.</p>
    </div><label className="cursor-pointer rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600">
      {busy ? "Reading feed…" : "Upload Awin CSV"}<input type="file" accept=".csv,text/csv" className="sr-only" disabled={busy} onChange={(event) => void handleFile(event.target.files?.[0])} />
    </label></div>
    <p className="mt-3 text-xs text-white/40">Awin path: Toolbox → Create-a-Feed → choose approved advertisers and relevant categories → download CSV. Upload the file itself, never the feed download URL or API key.</p>
    {message ? <p role="alert" className="mt-4 text-sm text-rose-200">{message}</p> : null}
    {preview ? <div className="mt-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-white/45">Feed rows</p><p className="mt-1 text-2xl font-bold">{preview.totalRows}</p></div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-white/45">Candidates parsed</p><p className="mt-1 text-2xl font-bold">{preview.candidateCount}</p></div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-white/45">Rows rejected</p><p className="mt-1 text-2xl font-bold">{preview.rejectedCount}</p></div>
      </div>
      {preview.candidates.slice(0, 20).map((candidate) => <article key={candidate.merchantName + ":" + candidate.productId} className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{candidate.name}</p><p className="mt-1 text-xs text-white/45">{candidate.merchantName} · {candidate.category || "Uncategorized"} · {candidate.productId}</p></div>
        <span className={candidate.eligibleForReview ? "rounded-full border border-emerald-300/30 px-3 py-1 text-xs text-emerald-200" : "rounded-full border border-amber-300/30 px-3 py-1 text-xs text-amber-200"}>{candidate.eligibleForReview ? "READY FOR HUMAN REVIEW" : candidate.availability}</span></div>
        <p className="mt-2 text-sm">${candidate.price.toFixed(2)} {candidate.currency}</p>
        {!candidate.eligibleForReview ? <p className="mt-1 text-xs text-amber-100/70">{candidate.reviewReasons.join(" · ")}</p> : null}
        <a className="mt-2 inline-block text-xs text-indigo-200 underline" href={candidate.productUrl} target="_blank" rel="noreferrer">Open affiliate product link</a>
      </article>)}
      <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-100/80">{preview.disclaimer}</p>
      <p className="text-xs text-white/40">Preview only. No product is imported, staged, published, purchased, or ordered.</p>
    </div> : null}
  </section>;
}
