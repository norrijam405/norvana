import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debugLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const all = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(20);
    return NextResponse.json(all);
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "History failed" }, { status: 500 });
  }
}
