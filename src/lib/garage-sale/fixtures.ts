/** Entirely fictional demo data: no account, geolocation, upload, checkout or real sale. */
export type GarageSaleItem = {
  id: string; name: string; price: number; category: string; condition: string; note: string;
};
export type GarageSale = {
  id: string; headline: string; sellerLabel: string; neighborhood: string;
  schedule: string; story: string; status: "FICTIONAL_DEMO";
  items: GarageSaleItem[];
};
export const GARAGE_SALE_FIXTURES: GarageSale[] = [
  {
    id: "maple-street", headline: "The Great Weekend Clear-Out",
    sellerLabel: "Demo seller A", neighborhood: "Sample neighborhood",
    schedule: "Fictional Saturday · appointment required",
    story: "A whole-house cleanout: useful finds from the kitchen, study, and garage. All listings are fictional.",
    status: "FICTIONAL_DEMO",
    items: [
      { id: "m1", name: "Oak side table", price: 28, category: "Furniture", condition: "Used · good", note: "Light scuffs" },
      { id: "m2", name: "Mixing bowl set", price: 12, category: "Home", condition: "Used · good", note: "Set of three" },
      { id: "m3", name: "Garden hand tools", price: 18, category: "Outdoors", condition: "Used · fair", note: "Six-piece bundle" },
      { id: "m4", name: "Desk lamp", price: 15, category: "Home", condition: "Used · good", note: "Fictional item" },
    ],
  },
  {
    id: "cedar-court", headline: "Moving-Day Mini Market",
    sellerLabel: "Demo seller B", neighborhood: "Sample neighborhood",
    schedule: "Fictional Sunday · appointment required",
    story: "One convenient digital storefront for a pretend moving sale, with optional item bundles.",
    status: "FICTIONAL_DEMO",
    items: [
      { id: "c1", name: "Camping chair pair", price: 22, category: "Outdoors", condition: "Used · good", note: "Two folding chairs" },
      { id: "c2", name: "Cookbook collection", price: 16, category: "Books", condition: "Used · good", note: "Four books" },
      { id: "c3", name: "Storage cube set", price: 20, category: "Home", condition: "Used · good", note: "Set of four" },
    ],
  },
];
export function bundleTotal(sale: GarageSale, selectedIds: string[]) {
  const ids = new Set(selectedIds);
  return sale.items.filter((item) => ids.has(item.id)).reduce((sum, item) => sum + item.price, 0);
}
