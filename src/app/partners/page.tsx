import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  partnerCollectionProducts,
  partnerCollections,
  products,
} from "@/db/schema";
import { PartnerMarketClient } from "@/components/partner-market-client";

export const dynamic = "force-dynamic";

export default async function PartnerMarketPage() {
  let activeCollection: typeof partnerCollections.$inferSelect | null = null;
  let featured: typeof products.$inferSelect[] = [];
  let allProducts: typeof products.$inferSelect[] = [];

  try {
    const [collection] = await db
      .select()
      .from(partnerCollections)
      .where(eq(partnerCollections.isActive, true))
      .orderBy(asc(partnerCollections.id))
      .limit(1);

    activeCollection = collection ?? null;

    allProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          eq(products.commerceModel, "AFFILIATE_REFERRAL")
        )
      )
      .orderBy(asc(products.name));

    if (activeCollection) {
      const rows = await db
        .select({
          product: products,
          position: partnerCollectionProducts.position,
        })
        .from(partnerCollectionProducts)
        .innerJoin(products, eq(partnerCollectionProducts.productId, products.id))
        .where(
          and(
            eq(partnerCollectionProducts.collectionId, activeCollection.id),
            eq(products.status, "active"),
            eq(products.commerceModel, "AFFILIATE_REFERRAL")
          )
        )
        .orderBy(asc(partnerCollectionProducts.position));

      featured = rows.map((row) => row.product);
    }
  } catch {
    // Partner-market tables may not be applied yet.
  }

  return (
    <PartnerMarketClient
      activeCollection={activeCollection}
      featured={featured}
      allProducts={allProducts}
    />
  );
}
