import { NextResponse } from "next/server";
import { db } from "@/db";
import { nicheVolumes } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(nicheVolumes).orderBy(asc(nicheVolumes.volumeNumber));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Volumes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch volumes" }, { status: 500 });
  }
}
