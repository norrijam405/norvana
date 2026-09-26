import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { codeBackups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const all = await db.select().from(codeBackups).orderBy(desc(codeBackups.createdAt)).limit(20);
    return NextResponse.json(all);
  } catch (error) {
    console.error("Restore GET error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const body = await req.json();
    const [backup] = await db.insert(codeBackups).values(body).returning();
    return NextResponse.json(backup, { status: 201 });
  } catch (error) {
    console.error("Restore POST error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
