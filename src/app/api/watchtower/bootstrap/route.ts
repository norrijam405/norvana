import { NextRequest, NextResponse } from "next/server";
import { requireRecoveryAdmin } from "@/lib/admin-guard";
import { bootstrapWatchtower } from "@/lib/watchtower/bootstrap";

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    await bootstrapWatchtower();
    return NextResponse.json({
      initialized: true,
      jobsStartPaused: true,
      executionEnabled: false,
    });
  } catch (error) {
    console.error("Watchtower bootstrap error:", error);
    return NextResponse.json(
      { error: "Watchtower initialization failed." },
      { status: 500 }
    );
  }
}
