import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  return NextResponse.json(
    {
      error: "Raw supplier credential storage is disabled during recovery.",
      code: "NORVANA_SECRET_CUSTODY_NOT_CONFIGURED",
      next: "Use a qualified external secret store and persist only safe references/fingerprints in Norvana.",
    },
    { status: 503 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const supplierId = Number(id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json({ error: "Invalid supplier id." }, { status: 400 });
    }

    await db
      .delete(supplierCredentials)
      .where(eq(supplierCredentials.supplierId, supplierId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Credentials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
