"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MerchandisingPlaceButton } from "@/components/admin/merchandising-place-button";

function placementForLane(lane: string) {
  const value = lane.toLowerCase();
  if (/(food|farm|market|produce|fresh|grocery)/.test(value)) return "Market Era";
  if (/(tech|style|premium|travel|gift|fashion|electronics|computer)/.test(value)) return "Finds Era";
  if (/(pet|home|everyday|goods|utility|desk|organization)/.test(value)) return "Goods Era";
  return "Goods Era";
}

export function ScoutCandidateActions({
  candidateId,
  lane,
  status,
  title,
  sourceName,
  sourceUrl,
}: {
  candidateId: number;
  lane: string;
  status: string;
  title: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const shortlisted = status === "SHORTLISTED" || status === "STAGED";
  const staged = status === "STAGED";
  const target = placementForLane(lane);

  async function act(action: "SHORTLIST" | "UNSHORTLIST" | "PASS" | "STAGE") {
    setPending(action);
    setMessage("");
    const response = await fetch(`/api/admin/watchtower/candidates/${candidateId}/decision`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || "Update failed.");
      setPending(null);
      return;
    }
    setMessage(
      action === "STAGE"
        ? `Staged for ${target}. Not published.`
        : action === "PASS"
          ? "Passed. Removed from your active Scout queue."
          : action === "SHORTLIST"
            ? "Checked. Keeping this one."
            : "Unchecked."
    );
    setPending(null);
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75">
          <input
            type="checkbox"
            checked={shortlisted}
            disabled={Boolean(pending)}
            onChange={(event) => void act(event.target.checked ? "SHORTLIST" : "UNSHORTLIST")}
            className="h-4 w-4"
          />
          Keep
        </label>

        <MerchandisingPlaceButton
          disabled={Boolean(pending)}
          payload={{
            name: title,
            lane,
            sourceType: /(farm|produce|fresh|grocery|food|market)/i.test(lane) ? "GROCERY" : "SUPPLIER",
            sourceName: sourceName || null,
            sourceKey: `watch-candidate:${candidateId}`,
            routeEvidence: sourceUrl ? { sourceUrl } : {},
          }}
          label={staged ? `Re-place · ${target}` : `▶ Place in ${target}`}
          onPlaced={() => void act("STAGE")}
        />

        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={() => void act("PASS")}
          className="min-h-11 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/45 disabled:opacity-50"
        >
          {pending === "PASS" ? "Passing…" : "✕ Pass"}
        </button>
      </div>

      <p className="mt-2 text-[10px] leading-4 text-white/35">
        Placement is a merchandising stage only. Public sale/referral still requires the Product Readiness Gate.
      </p>
      {message ? <p className="mt-2 text-[11px] text-indigo-200">{message}</p> : null}
    </div>
  );
}
