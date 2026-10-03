import { NextResponse } from "next/server";
import { resolveCurrentPublicEra } from "@/lib/era-engine/resolver";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await resolveCurrentPublicEra();

    if (!result.ok) {
      return NextResponse.json(
        { error: "Current Era is unavailable.", code: result.code },
        { status: result.code === "NO_ACTIVE_PRIMARY_ERA" ? 404 : 503 }
      );
    }

    return NextResponse.json(
      { era: result.era },
      { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Current Era resolver failed:", error);
    return NextResponse.json({ error: "Current Era is temporarily unavailable." }, { status: 503 });
  }
}
