"use client";

import { useState } from "react";
import { GarageSaleDraftWorkbench } from "@/components/garage-sale/garage-sale-draft-workbench";
import { PhotoReviewWorkbench } from "@/components/garage-sale/photo-review-workbench";
import type { DraftItem } from "@/lib/garage-sale/drafts";

/** One in-tab journey; no remote writes or persistent browser storage. */
export function SellerStudio() {
  const [items, setItems] = useState<DraftItem[]>([]);
  return <>
    <GarageSaleDraftWorkbench onItemsChange={setItems} />
    <PhotoReviewWorkbench items={items} />
  </>;
}
