'use client';

import { FormEvent, useState } from "react";

type JsonRecord = Record<string, unknown>;

function dollarsToCents(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function IntelligenceWorkbench() {
  const [producerStatus, setProducerStatus] = useState<string>("");
  const [mediaStatus, setMediaStatus] = useState<string>("");
  const [mediaCandidates, setMediaCandidates] = useState<JsonRecord[]>([]);
  const [darwinStatus, setDarwinStatus] = useState<string>("");
  const [darwinResult, setDarwinResult] = useState<JsonRecord | null>(null);
  const [darwinSummary, setDarwinSummary] = useState<{ sale: number; expenses: number; deliveryOnTime: number | null; samples: number; evidenceNote: string; evidenceAgeDays: number | null } | null>(null);

  async function submitProducer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProducerStatus("Saving prospect…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/admin/local-producers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        channel: String(form.get("channel") || "FARM"),
        serviceAreas: String(form.get("serviceArea") || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        productCategories: String(form.get("categories") || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        wholesaleAvailable: form.get("wholesaleAvailable") === "on",
        fulfillmentModes: ["CUSTOMER_PICKUP"],
        shipsNationally: false,
        coldChainRequired: form.get("coldChainRequired") === "on",
        mediaPermissionStatus: "DISCUSS",
        pilotInterest: String(form.get("pilotInterest") || "UNKNOWN"),
      }),
    });

    const payload = await response.json();
    setProducerStatus(
      response.ok
        ? `Saved ${payload.producer?.name ?? "producer"} as a prospect.`
        : `Could not save: ${payload.error ?? "unknown error"}`
    );
    if (response.ok) event.currentTarget.reset();
  }

  async function searchMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMediaStatus("Searching approved providers…");
    setMediaCandidates([]);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/admin/media/stock-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: String(form.get("query") || ""),
        limit: 12,
        orientation: "LANDSCAPE",
      }),
    });

    const payload = await response.json();
    setMediaCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
    if (!response.ok) {
      setMediaStatus(`Search failed: ${payload.error ?? "unknown error"}`);
      return;
    }

    const missing = Array.isArray(payload.unavailableProviders)
      ? payload.unavailableProviders
      : [];
    setMediaStatus(
      `${payload.candidates?.length ?? 0} candidates found.${
        missing.length ? ` Missing/failed: ${missing.join(", ")}` : ""
      }`
    );
  }

  async function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDarwinStatus("Evaluating…");
    setDarwinResult(null);
    setDarwinSummary(null);
    const form = new FormData(event.currentTarget);
    const onTime = Math.max(0, Math.min(500, Math.floor(Number(form.get("onTimeCount") || 0))));
    const late = Math.max(0, Math.min(500, Math.floor(Number(form.get("lateCount") || 0))));
    const handlingDays = Number(form.get("handlingDays") || 1);
    const transitDays = Number(form.get("transitDays") || 2);

    const observations = [
      ...Array.from({ length: onTime }, () => ({
        handlingDays,
        transitDays,
        deliveredOnTime: true,
      })),
      ...Array.from({ length: late }, () => ({
        handlingDays,
        transitDays: transitDays + 2,
        deliveredOnTime: false,
        trackingGapHours: 48,
      })),
    ];

    const candidateKey = String(form.get("candidateKey") || "manual-candidate");
    const evidenceNote = String(form.get("evidenceNote") || "").trim().slice(0, 240);
    const evidenceDate = String(form.get("evidenceDate") || "");
    const evidenceTimestamp = /^\d{4}-\d{2}-\d{2}$/.test(evidenceDate) ? Date.parse(evidenceDate + "T00:00:00Z") : NaN;
    const evidenceAgeDays = Number.isFinite(evidenceTimestamp)
      ? Math.floor((Date.now() - evidenceTimestamp) / 86400000)
      : null;
    const response = await fetch("/api/admin/intelligence/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subjectType: "PRODUCT",
        subjectKey: candidateKey,
        candidateKey,
        evidenceRef: `manual:operator:${Date.now()}`,
        economics: {
          salePriceCents: dollarsToCents(String(form.get("salePrice") || "0")),
          productCostCents: dollarsToCents(String(form.get("productCost") || "0")),
          outboundShippingCents: dollarsToCents(String(form.get("shipping") || "0")),
          paymentFeeCents: dollarsToCents(String(form.get("paymentFee") || "0")),
          returnReserveCents: dollarsToCents(String(form.get("returnReserve") || "0")),
        },
        demand: {
          internalRequests: Number(form.get("requests") || 0),
          sellThroughRate: Number(form.get("sellThrough") || 0) / 100,
          repeatPurchaseRate: Number(form.get("repeatPurchase") || 0) / 100,
          searchTrendIndex: Number(form.get("searchTrend") || 0),
          customerVoiceScore: Number(form.get("customerVoice") || 0),
          velocityIndex: Number(form.get("velocity") || 0),
          sampleSize: Number(form.get("sampleSize") || 0),
          observedAt: new Date().toISOString(),
        },
        deliveryObservations: observations,
        sourceTrustScore: Number(form.get("sourceTrust") || 0),
        returnRisk: Number(form.get("returnRisk") || 0),
        spoilageRisk: Number(form.get("spoilageRisk") || 0),
        supportBurden: Number(form.get("supportBurden") || 0),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setDarwinStatus(`Evaluation failed: ${payload.error ?? "unknown error"}`);
      return;
    }

    setDarwinStatus(payload.decision?.eligible ? "Eligible for further qualification." : "Rejected by R0 policy.");
    setDarwinResult(payload.decision ?? null);
    const sale = dollarsToCents(String(form.get("salePrice") || "0"));
    const expenses = ["productCost", "shipping", "paymentFee", "returnReserve"]
      .reduce((total, key) => total + dollarsToCents(String(form.get(key) || "0")), 0);
    setDarwinSummary({ sale, expenses, deliveryOnTime: onTime + late > 0 ? onTime / (onTime + late) : null, samples: onTime + late, evidenceNote, evidenceAgeDays });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-accent">PRODUCERS</p>
        <h2 className="mt-2 font-display text-xl font-bold">Farm prospect intake</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Capture a prospect only. This does not enroll, contact, or activate a producer.
        </p>
        <form onSubmit={submitProducer} className="mt-5 space-y-3">
          <input name="name" required placeholder="Farm / producer name" className="w-full rounded-xl border border-border bg-bone px-4 py-3 text-sm" />
          <select name="channel" defaultValue="FARM" className="w-full rounded-xl border border-border bg-bone px-4 py-3 text-sm">
            <option value="FARM">Farm</option>
            <option value="FOOD_HUB">Food hub</option>
            <option value="COOPERATIVE">Cooperative</option>
            <option value="MARKET">Market</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="MAKER">Maker</option>
          </select>
          <input name="serviceArea" required placeholder="Service areas, comma separated" className="w-full rounded-xl border border-border bg-bone px-4 py-3 text-sm" />
          <input name="categories" required placeholder="Products, e.g. produce, eggs" className="w-full rounded-xl border border-border bg-bone px-4 py-3 text-sm" />
          <select name="pilotInterest" defaultValue="UNKNOWN" className="w-full rounded-xl border border-border bg-bone px-4 py-3 text-sm">
            <option value="UNKNOWN">Pilot interest unknown</option>
            <option value="YES">Interested in pilot</option>
            <option value="MAYBE">Maybe</option>
            <option value="NO">Not interested</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="wholesaleAvailable" /> Wholesale available
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="coldChainRequired" /> Cold chain required
          </label>
          <button className="btn-primary w-full" type="submit">Save prospect</button>
        </form>
        {producerStatus ? <p className="mt-3 text-xs leading-5 text-muted">{producerStatus}</p> : null}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-accent">MEDIA</p>
        <h2 className="mt-2 font-display text-xl font-bold">Hero footage discovery</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Search only. Every result stays unapproved until rights and implication review.
        </p>
        <form onSubmit={searchMedia} className="mt-5 flex gap-2">
          <input name="query" required placeholder="fresh produce harvest" className="min-w-0 flex-1 rounded-xl border border-border bg-bone px-4 py-3 text-sm" />
          <button className="btn-primary" type="submit">Search</button>
        </form>
        {mediaStatus ? <p className="mt-3 text-xs leading-5 text-muted">{mediaStatus}</p> : null}
        <div className="mt-4 space-y-3">
          {mediaCandidates.slice(0, 5).map((candidate, index) => (
            <div key={String(candidate.externalId ?? index)} className="rounded-2xl border border-border bg-bone p-4">
              <div className="flex justify-between gap-3">
                <p className="font-medium">{String(candidate.title ?? "Untitled")}</p>
                <span className="font-mono text-[10px] text-muted">{String(candidate.provider ?? "")}</span>
              </div>
              {typeof candidate.pageUrl === "string" && candidate.pageUrl ? (
                <a
                  href={candidate.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-[11px] font-medium text-indigo-accent underline underline-offset-2"
                >
                  View source on {String(candidate.provider ?? "provider")}
                </a>
              ) : null}
              <p className="mt-2 text-xs text-amber-700">REVIEW REQUIRED</p>
              {Array.isArray(candidate.reviewFlags) && candidate.reviewFlags.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(candidate.reviewFlags as string[]).map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800"
                    >
                      {flag.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-muted">No automatic risk flags. Human review still required.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-accent">DARWIN</p>
        <h2 className="mt-2 font-display text-xl font-bold">Opportunity sandbox</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Experiment with candidate economics and delivery assumptions. All default scores are illustrative operator inputs, not verified supplier facts. This cannot publish, order, refund, or create a shipment.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-bone p-3 text-xs leading-5 text-muted">
          <p className="font-semibold text-obsidian">How to read these inputs</p>
          <p>Price and expenses: dollars per unit. Requests and sample size: counts. Sell-through and repeat: percentages. Trend, voice, velocity, trust, and risks: manual 0–100 scores (higher risk scores mean more risk).</p>
          <p className="mt-2">On-time and late samples are simulated delivery observations; handling and transit use days. These defaults are examples, not imported supplier or customer evidence.</p>
        </div>
        <form onSubmit={evaluate} className="mt-5 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-medium text-muted">Evidence reference (optional, operator-provided)
            <input name="evidenceNote" maxLength={240} placeholder="Supplier quote ID or research source" className="mt-1 w-full rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          </label>
          <label className="col-span-2 text-xs font-medium text-muted">Evidence observation date (optional)
            <input name="evidenceDate" type="date" className="mt-1 w-full rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          </label>
          <input name="candidateKey" required placeholder="Candidate" className="col-span-2 rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="salePrice" type="number" step="0.01" required placeholder="Sale $" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="productCost" type="number" step="0.01" required placeholder="Cost $" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="shipping" type="number" step="0.01" defaultValue="0" placeholder="Shipping $" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="paymentFee" type="number" step="0.01" defaultValue="0" placeholder="Payment fee $" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="returnReserve" type="number" step="0.01" defaultValue="0" placeholder="Return reserve $" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="requests" type="number" defaultValue="10" placeholder="Requests" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="sellThrough" type="number" defaultValue="60" min="0" max="100" placeholder="Sell-through %" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="repeatPurchase" type="number" defaultValue="20" min="0" max="100" placeholder="Repeat %" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="searchTrend" type="number" defaultValue="60" min="0" max="100" placeholder="Trend" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="customerVoice" type="number" defaultValue="70" min="0" max="100" placeholder="Voice" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="velocity" type="number" defaultValue="60" min="0" max="100" placeholder="Velocity" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="sampleSize" type="number" defaultValue="50" placeholder="Sample size" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="sourceTrust" type="number" defaultValue="80" min="0" max="100" placeholder="Source trust" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="returnRisk" type="number" defaultValue="10" min="0" max="100" placeholder="Return risk" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="spoilageRisk" type="number" defaultValue="10" min="0" max="100" placeholder="Spoilage risk" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="supportBurden" type="number" defaultValue="10" min="0" max="100" placeholder="Support burden" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="onTimeCount" type="number" defaultValue="8" placeholder="On-time samples" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="lateCount" type="number" defaultValue="2" placeholder="Late samples" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="handlingDays" type="number" step="0.5" defaultValue="1" placeholder="Handling days" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <input name="transitDays" type="number" step="0.5" defaultValue="2" placeholder="Transit days" className="rounded-xl border border-border bg-bone px-3 py-2 text-sm" />
          <button className="btn-primary col-span-2" type="submit">Evaluate candidate</button>
        </form>
        {darwinStatus ? <p className="mt-3 text-xs leading-5 text-muted">{darwinStatus}</p> : null}
        {darwinResult && darwinSummary ? (
          <div className="mt-4 space-y-3" aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-accent">Operator scenario · unverified inputs</p>
            <div className="rounded-xl border border-border bg-bone p-3 text-xs leading-5">
              <p className="font-semibold">Evidence status: NOT VERIFIED</p>
              <p className="mt-1 text-muted">Reference: {darwinSummary.evidenceNote || "Not supplied"} (operator claim only)</p>
              <p className="text-muted">Observed: {darwinSummary.evidenceAgeDays === null ? "Unknown" : darwinSummary.evidenceAgeDays < 0 ? "Future date — invalid for current evidence" : darwinSummary.evidenceAgeDays > 30 ? darwinSummary.evidenceAgeDays + " days ago · needs refresh" : darwinSummary.evidenceAgeDays + " days ago · freshness not independently verified"}</p>
              <p className="mt-1 text-muted">A reference or recent date is not supplier authentication. Scores remain assumptions until verified against an independent source.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-bone p-3">
                <p className="text-xs text-muted">Estimated contribution / unit</p>
                <p className="mt-1 text-lg font-bold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((darwinSummary.sale - darwinSummary.expenses) / 100)}</p>
              </div>
              <div className="rounded-xl border border-border bg-bone p-3">
                <p className="text-xs text-muted">Estimated contribution margin</p>
                <p className="mt-1 text-lg font-bold">{darwinSummary.sale > 0 ? ((darwinSummary.sale - darwinSummary.expenses) / darwinSummary.sale * 100).toFixed(1) + "%" : "N/A"}</p>
              </div>
              <div className="rounded-xl border border-border bg-bone p-3">
                <p className="text-xs text-muted">Example on-time delivery</p>
                <p className="mt-1 font-semibold">{darwinSummary.deliveryOnTime === null ? "No sample" : (darwinSummary.deliveryOnTime * 100).toFixed(0) + "%"}</p>
              </div>
              <div className="rounded-xl border border-border bg-bone p-3">
                <p className="text-xs text-muted">Delivery observations</p>
                <p className="mt-1 font-semibold">{darwinSummary.samples} simulated</p>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted">Contribution estimates subtract entered product cost, outbound shipping, payment fee, and return reserve only. They exclude taxes, marketing, overhead, and other unentered expenses. No supplier data has been independently verified.</p>
            <details className="rounded-xl border border-border bg-bone p-3">
              <summary className="cursor-pointer text-sm font-medium">Inspect Darwin decision details (JSON)</summary>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-obsidian p-3 text-[11px] text-white/80">{JSON.stringify(darwinResult, null, 2)}</pre>
            </details>
          </div>
        ) : null}
      </section>
    </div>
  );
}
