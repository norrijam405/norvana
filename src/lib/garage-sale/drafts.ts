/**
 * Fictional Garage Sale bulk-item review. Pure parser only: no uploads, persistence,
 * publication or network effects. Submitted data stays in the current browser session.
 */
export type DraftItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  condition: string;
  approved: boolean;
};
export type DraftReview = { items: DraftItem[]; errors: string[]; rejected: number };
export const SAMPLE_BULK_ITEMS = [
  "Lamp|Home|15|Used - good",
  "Board games|Toys|12|Used - good",
  "Patio planters|Outdoors|25|Used - fair",
].join("\n");

const allowedConditions = new Set(["New", "Used - like new", "Used - good", "Used - fair", "For parts"]);
export function parseGarageSaleDraft(text: string): DraftReview {
  const lines = text.replace(/\r/g, "").split("\n");
  const errors: string[] = [];
  const items: DraftItem[] = [];
  const names = new Set<string>();
  let rejected = 0;
  if (text.length > 15000) return { items: [], errors: ["Input too large. Limit is 15,000 characters."], rejected: 0 };
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) continue;
    if (items.length >= 40) { errors.push("Maximum 40 valid items per review."); rejected++; continue; }
    const parts = line.split("|").map(x => x.trim());
    if (parts.length !== 4) { errors.push(`Line ${index + 1}: use name | category | price | condition.`); rejected++; continue; }
    const [name, category, amount, condition] = parts;
    const price = Number(amount);
    if (!name || name.length > 90 || !category || category.length > 50 || !Number.isFinite(price) || price <= 0 || price > 10000 || !/^\d+(?:\.\d{1,2})?$/.test(amount) || !allowedConditions.has(condition)) {
      errors.push(`Line ${index + 1}: invalid item, price or condition.`);
      rejected++; continue;
    }
    const key = name.toLowerCase();
    if (names.has(key)) { errors.push(`Line ${index + 1}: duplicate item name; review manually.`); rejected++; continue; }
    names.add(key);
    items.push({ id: `draft-${index + 1}`, name, category, price, condition, approved: false });
  }
  if (!items.length && errors.length === 0) errors.push("Enter at least one item to review.");
  return { items, errors: errors.slice(0, 50), rejected };
}
export function markDraftItem(items: DraftItem[], id: string, approved: boolean) {
  return items.map(item => item.id === id ? { ...item, approved } : item);
}
export function approvedDraftItems(items: DraftItem[]) {
  return items.filter(item => item.approved);
}
export type GarageSaleEventFixture = { id: string; name: string; neighborhood: string; schedule: string; saleIds: string[]; fictional: true };
export const GARAGE_SALE_EVENTS: GarageSaleEventFixture[] = [
  { id: "sample-weekend", name: "Neighborhood Clear-Out Weekend", neighborhood: "Sample neighborhood", schedule: "Fictional weekend · no exact time", saleIds: ["maple-street", "cedar-court"], fictional: true }
];
