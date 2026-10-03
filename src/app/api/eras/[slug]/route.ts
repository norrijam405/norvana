import { NextResponse } from "next/server";
import { resolvePublicEraBySlug } from "@/lib/era-engine/resolver";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const era = await resolvePublicEraBySlug(slug);
    if (!era) {
      return NextResponse.json({ error: "Era not found." }, { status: 404 });
    }

    return NextResponse.json(
      { era },
      { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Era resolver failed:", error);
    return NextResponse.json({ error: "Era is temporarily unavailable." }, { status: 503 });
  }
}
