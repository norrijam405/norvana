import { db } from "@/db";
import { nicheVolumes, products } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { ArchiveClient } from "@/components/archive-client";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  let volumes: (typeof nicheVolumes.$inferSelect & { productCount: number })[] = [];

  try {
    const vols = await db.select().from(nicheVolumes).orderBy(asc(nicheVolumes.volumeNumber));
    volumes = await Promise.all(
      vols.map(async (v) => {
        const [count] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.volumeNumber, v.volumeNumber));
        return { ...v, productCount: count.count };
      })
    );
  } catch {
    // Tables may not exist
  }

  return <ArchiveClient volumes={volumes} />;
}
