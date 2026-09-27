import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews, suppliers, nicheVolumes, subscribers } from "@/db/schema";
import { SAMPLE_PRODUCTS, SAMPLE_VOLUMES, SAMPLE_SUPPLIERS, SAMPLE_REVIEWS } from "@/lib/constants";
import { sql } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    // Clear existing data
    await db.execute(sql`TRUNCATE products, reviews, suppliers, niche_volumes, subscribers RESTART IDENTITY CASCADE`);

    // Seed suppliers
    const insertedSuppliers = await db.insert(suppliers).values(SAMPLE_SUPPLIERS).returning();

    // Seed products with supplier IDs
    const insertedProducts = await db.insert(products).values(
      SAMPLE_PRODUCTS.map((p, i) => ({
        ...p,
        supplierId: insertedSuppliers[i % insertedSuppliers.length].id,
      }))
    ).returning();

    // Seed reviews for each product
    for (const product of insertedProducts) {
      const reviewsForProduct = SAMPLE_REVIEWS.slice(0, Math.floor(Math.random() * 3) + 2).map((r) => ({
        ...r,
        productId: product.id,
      }));
      await db.insert(reviews).values(reviewsForProduct);
    }

    // Seed volumes
    await db.insert(nicheVolumes).values(SAMPLE_VOLUMES);

    // Seed a subscriber
    await db.insert(subscribers).values({ email: "demo@norvana.co" });

    return NextResponse.json({ success: true, products: insertedProducts.length, suppliers: insertedSuppliers.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
