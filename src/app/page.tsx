import { db } from "@/db";
import { products, nicheVolumes, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredProducts: typeof import("@/db/schema").products.$inferSelect[] = [];
  let activeVolume: typeof import("@/db/schema").nicheVolumes.$inferSelect | null = null;
  let recentReviews: typeof import("@/db/schema").reviews.$inferSelect[] = [];
  let stats = { products: 0, orders: 0, subscribers: 0 };

  try {
    featuredProducts = await db
      .select()
      .from(products)
      .where(eq(products.status, "active"))
      .orderBy(desc(products.rating))
      .limit(6);

    const [vol] = await db
      .select()
      .from(nicheVolumes)
      .where(eq(nicheVolumes.isActive, true))
      .limit(1);
    activeVolume = vol ?? null;

    recentReviews = await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(6);

    const [pCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
    stats.products = pCount.count;
  } catch {
    // Tables may not exist yet
  }

  return (
    <HomeClient
      featuredProducts={featuredProducts}
      activeVolume={activeVolume}
      recentReviews={recentReviews}
      stats={stats}
    />
  );
}
