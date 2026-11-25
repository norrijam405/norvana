export type AwinFeedCandidate = {
  productId: string; name: string; merchantId: string; merchantName: string;
  price: number; currency: string; category: string; description: string;
  productUrl: string; imageUrl: string | null; deliveryCost: string | null;
  deliveryTime: string | null; availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  eligibleForReview: boolean; reviewReasons: string[];
};
export type AwinFeedPreview = { totalRows: number; candidateCount: number; rejectedCount: number; candidates: AwinFeedCandidate[]; disclaimer: string; };
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}
function httpsUrl(value: string): string | null {
  try { const url = new URL(value.trim()); return url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
}
const yes = (v: string) => /^(1|true|yes|y|in stock|available)$/i.test(v.trim());
const no = (v: string) => /^(0|false|no|n|out of stock|unavailable)$/i.test(v.trim());
const prohibited = /\b(adult|alcohol|beer|wine|liquor|tobacco|vape|nicotine|cbd|thc|cannabis|weapon|firearm|knife|supplement|steroid|medicine|prescription|drug)\b/i;
export function previewAwinProductFeed(input: string, limit = 100): AwinFeedPreview {
  if (typeof input !== "string" || input.trim().length === 0) throw new Error("Upload a non-empty Awin product feed CSV.");
  if (Buffer.byteLength(input, "utf8") > 2_000_000) throw new Error("Feed is too large. Upload a filtered CSV under 2 MB.");
  const clean = input.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiters = [",", "\t", ";"];
  const delimiter = delimiters.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = parseCsv(clean, delimiter);
  if (rows.length < 2) throw new Error("The feed needs a header row and at least one product row.");
  if (rows.length > 2_001) throw new Error("Feed contains more than 2,000 rows. Filter it in Awin before uploading.");
  const headers = rows[0].map((v) => v.trim().toLowerCase());
  const index = new Map(headers.map((h, i) => [h, i]));
  const value = (row: string[], ...names: string[]) => {
    for (const name of names) { const p = index.get(name); if (p !== undefined) return (row[p] || "").trim(); }
    return "";
  };
  const required = ["product_name", "price", "currency", "aw_deep_link"];
  const missing = required.filter((name) => !index.has(name));
  if (missing.length) throw new Error("Awin feed is missing required columns: " + missing.join(", ") + ".");
  if (!index.has("aw_product_id") && !index.has("product_id")) throw new Error("Awin feed must include aw_product_id or product_id.");
  const candidates: AwinFeedCandidate[] = []; let rejectedCount = 0; const seen = new Set<string>();
  const dataRows = rows.slice(1);
  for (const row of dataRows) {
    const productId = value(row, "aw_product_id", "product_id");
    const name = value(row, "product_name");
    const merchantName = value(row, "merchant_name");
    const merchantId = value(row, "merchant_id");
    const currency = value(row, "currency").toUpperCase();
    const priceRaw = value(row, "price");
    const price = /^\d+(?:\.\d{1,2})?$/.test(priceRaw) ? Number(priceRaw) : NaN;
    const productUrl = httpsUrl(value(row, "aw_deep_link"));
    const imageUrl = httpsUrl(value(row, "aw_image_url", "image_url", "large_image"));
    const stockRaw = value(row, "in_stock");
    const quantityRaw = value(row, "stock_quantity", "number_available");
    const quantity = /^\d+$/.test(quantityRaw) ? Number(quantityRaw) : null;
    const saleRaw = value(row, "is_for_sale");
    const availability: AwinFeedCandidate["availability"] =
      no(stockRaw) || no(saleRaw) || quantity === 0 ? "OUT_OF_STOCK" :
      yes(stockRaw) || (quantity !== null && quantity > 0) ? "IN_STOCK" : "UNKNOWN";
    const category = value(row, "category_name", "merchant_category", "product_type");
    const description = value(row, "description", "product_short_description");
    const reasons: string[] = [];
    if (!productId || !name || !merchantName || !merchantId) reasons.push("Missing product or advertiser identity");
    if (!Number.isFinite(price) || price <= 0) reasons.push("Missing or invalid product price");
    if (currency !== "USD") reasons.push("Only USD product feeds are eligible for this US-first review");
    if (!productUrl) reasons.push("Missing or invalid HTTPS Awin tracking link");
    if (!imageUrl) reasons.push("Missing valid HTTPS product image; image rights also require review");
    if (availability !== "IN_STOCK") reasons.push(availability === "OUT_OF_STOCK" ? "Advertiser reports out of stock" : "Stock is not explicitly verified");
    if (saleRaw && no(saleRaw)) reasons.push("Advertiser marks product as not for sale");
    if (prohibited.test(name + " " + category + " " + description)) reasons.push("Product falls into a restricted or excluded category");
    const identity = merchantId + ":" + productId;
    if (seen.has(identity)) reasons.push("Duplicate product identity in this feed");
    if (productId && merchantId) seen.add(identity);
    if (!productId || !name || !merchantName || !merchantId || !Number.isFinite(price) || price <= 0 || !productUrl) { rejectedCount += 1; continue; }
    candidates.push({
      productId, name: name.slice(0, 180), merchantId, merchantName: merchantName.slice(0, 160),
      price, currency, category: category.slice(0, 120), description: description.slice(0, 1200),
      productUrl, imageUrl, deliveryCost: value(row, "delivery_cost") || null,
      deliveryTime: value(row, "delivery_time") || null, availability,
      eligibleForReview: reasons.length === 0, reviewReasons: reasons,
    });
  }
  return {
    totalRows: dataRows.length, candidateCount: candidates.length, rejectedCount,
    candidates: candidates.slice(0, Math.max(1, Math.min(limit, 100))),
    disclaimer: "Preview only. No products were imported, staged, published, purchased, or ordered. Affiliate program membership, commission, image rights, current stock, delivery terms, and merchant approval still require review.",
  };
}
