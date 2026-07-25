import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ShopClient } from "@/components/shop-client";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let allProducts: typeof products.$inferSelect[] = [];
  try {
    allProducts = await db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt));
  } catch {
    // Tables may not exist yet
  }

  return <ShopClient products={allProducts} />;
}
