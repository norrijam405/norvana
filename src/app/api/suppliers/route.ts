import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const all = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const body = await req.json();
    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: String(body.name || "").slice(0, 255),
        type: body.type || "manual",
        platform: body.platform || null,
        url: body.url || "",
        contactEmail: body.contactEmail || "",
        notes: body.notes || "",
        niches: Array.isArray(body.niches) ? body.niches : [],
        isActive: false,
        autoFulfill: false,
      })
      .returning();

    return NextResponse.json(
      {
        ...supplier,
        r0Authority: "DISCOVERED_RECORD_ONLY",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
