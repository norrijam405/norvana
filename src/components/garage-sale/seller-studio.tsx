"use client";

import { useState } from "react";
import { GarageSaleDraftWorkbench } from "@/components/garage-sale/garage-sale-draft-workbench";
import { PhotoReviewWorkbench } from "@/components/garage-sale/photo-review-workbench";
import { buildGarageSaleReviewManifest } from "@/lib/garage-sale/review-manifest";
import type { DraftItem } from "@/lib/garage-sale/drafts";
import type { AssignedDemoPhoto } from "@/lib/garage-sale/photo-review";

/** One in-tab journey; no remote writes or persistent browser storage. */
export function SellerStudio() {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [photos, setPhotos] = useState<AssignedDemoPhoto[]>([]);
  const [exportNotice, setExportNotice] = useState("");
  const manifest = buildGarageSaleReviewManifest(items, photos);

  function downloadReview() {
    if (!manifest.approvedItemCount) {
      setExportNotice("Approve at least one item before exporting your local review.");
      return;
    }
    // Initiated by the user. File contains only approved item details and photo counts.
    // No image bytes, original photo names, messages, seller IDs or location.
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = "acre-era-garage-sale-review.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportNotice("Local review file prepared. Nothing was submitted or published.");
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  return <>
    <GarageSaleDraftWorkbench onItemsChange={setItems} />
    <PhotoReviewWorkbench items={items} onPhotosChange={setPhotos} />
    <section className="mt-7 rounded-[2rem] border border-soil/10 bg-cream p-6 md:p-9" aria-labelledby="seller-review-summary">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-leaf">Seller studio · final local review</p>
      <h2 id="seller-review-summary" className="mt-2 font-display text-3xl font-black">Review your sale before anything goes live.</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <p className="rounded-xl bg-sage-wash p-4 text-sm"><strong className="block text-2xl">{manifest.approvedItemCount}</strong> approved items</p>
        <p className="rounded-xl bg-sage-wash p-4 text-sm"><strong className="block text-2xl">{manifest.approvedPhotoCount}</strong> approved linked photos</p>
        <p className="rounded-xl bg-sage-wash p-4 text-sm"><strong className="block text-2xl">${manifest.subtotal.toFixed(2)}</strong> sample total</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        Download a review summary containing approved item details and photo counts only.
        Original photos, filenames and EXIF/location metadata are excluded. This is not a seller listing, receipt or publication.
      </p>
      <button type="button" onClick={downloadReview} disabled={!manifest.approvedItemCount}
        className="mt-4 rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
        Export local review JSON
      </button>
      <p role="status" className="mt-3 text-xs text-muted">{exportNotice || "Publishing, storage and real seller identity remain disabled."}</p>
    </section>
  </>;
}
