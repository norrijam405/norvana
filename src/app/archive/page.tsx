import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { eras } from "@/db/schema";
import { ArchiveClient } from "@/components/archive-client";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  let archivedEras: typeof eras.$inferSelect[] = [];

  try {
    archivedEras = await db
      .select()
      .from(eras)
      .where(
        and(
          eq(eras.visibility, "PUBLIC"),
          inArray(eras.lifecycleState, ["CLOSED", "ARCHIVED"])
        )
      )
      .orderBy(desc(eras.endAt), desc(eras.updatedAt));
  } catch {
    // Preview may not have an applied Era schema/data source yet.
  }

  return <ArchiveClient eras={archivedEras} />;
}
