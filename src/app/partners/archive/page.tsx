import { asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  partnerCollectionProducts,
  partnerCollections,
} from "@/db/schema";
import { PartnerArchiveClient } from "@/components/partner-archive-client";

export const dynamic = "force-dynamic";

export default async function PartnerArchivePage() {
  let collections: Array<
    typeof partnerCollections.$inferSelect & { productCount: number }
  > = [];

  try {
    const rows = await db
      .select({
        id: partnerCollections.id,
        slug: partnerCollections.slug,
        title: partnerCollections.title,
        eyebrow: partnerCollections.eyebrow,
        description: partnerCollections.description,
        theme: partnerCollections.theme,
        heroImage: partnerCollections.heroImage,
        startDate: partnerCollections.startDate,
        endDate: partnerCollections.endDate,
        isActive: partnerCollections.isActive,
        createdAt: partnerCollections.createdAt,
        productCount: sql<number>`count(${partnerCollectionProducts.id})::int`,
      })
      .from(partnerCollections)
      .leftJoin(
        partnerCollectionProducts,
        eq(partnerCollectionProducts.collectionId, partnerCollections.id)
      )
      .where(ne(partnerCollections.isActive, true))
      .groupBy(partnerCollections.id)
      .orderBy(asc(partnerCollections.id));

    collections = rows;
  } catch {
    // Partner-market tables may not be applied yet.
  }

  return <PartnerArchiveClient collections={collections} />;
}
