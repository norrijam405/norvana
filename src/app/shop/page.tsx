import type { Metadata } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ShopClient } from "@/components/shop-client";
import { ACRE_ERA_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";

export const metadata: Metadata = {
  title: "Goods Era — Everyday goods, home, pets, beauty, tech, and more",
  description: "Browse Acre Era Goods for useful everyday products across home, pets, beauty, family, electronics, gaming, style, and more as supply is qualified.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Goods Era — Everyday goods, home, pets, beauty, tech, and more | Acre Era",
    description: "Browse Acre Era Goods for useful everyday products across home, pets, beauty, family, electronics, gaming, style, and more as supply is qualified.",
    url: "/shop",
  },
};

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
