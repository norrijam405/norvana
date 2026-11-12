/**
 * Garage Sale R4: deterministic, non-public review manifest.
 * Deliberately excludes original photo bytes, file names, image URLs, EXIF,
 * seller details, location and private messages. No publication authority.
 */
import type { DraftItem } from "./drafts.ts";
import type { AssignedDemoPhoto } from "./photo-review.ts";

export type ReviewManifestItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  price: number;
  approvedPhotoCount: number;
};
export type ReviewManifest = {
  schemaVersion: "acre-era-garage-sale-review-r0";
  state: "LOCAL_REVIEW_ONLY";
  publishAuthorized: false;
  itemCount: number;
  approvedItemCount: number;
  approvedPhotoCount: number;
  subtotal: number;
  items: ReviewManifestItem[];
};

export function buildGarageSaleReviewManifest(items: DraftItem[], photos: AssignedDemoPhoto[]): ReviewManifest {
  // Only approved items appear; omit all photo metadata, in particular original
  // filenames that might reveal addresses or identities.
  const approvedItems = items.filter(item => item.approved).slice(0, 40);
  const safeItems = approvedItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    condition: item.condition,
    price: item.price,
    approvedPhotoCount: photos.filter(photo => photo.approved && photo.itemId === item.id).length,
  }));
  return {
    schemaVersion: "acre-era-garage-sale-review-r0",
    state: "LOCAL_REVIEW_ONLY",
    publishAuthorized: false,
    itemCount: items.length,
    approvedItemCount: safeItems.length,
    approvedPhotoCount: safeItems.reduce((sum, item) => sum + item.approvedPhotoCount, 0),
    subtotal: Math.round(safeItems.reduce((sum, item) => sum + item.price, 0) * 100) / 100,
    items: safeItems,
  };
}
