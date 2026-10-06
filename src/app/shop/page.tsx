import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ShopClient } from "@/components/shop-client";
import { ACRE_ERA_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let allProducts: typeof products.$inferSelect[] = [];
  try {
    allProducts = await db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt));
  } catch {
    // Tables may not exist yet
  }

  const displayProducts =
    allProducts.length > 0
      ? allProducts
      : process.env.VERCEL_ENV === "preview"
        ? ACRE_ERA_PREVIEW_PRODUCTS
        : [];

  return <ShopClient products={displayProducts} />;
}
