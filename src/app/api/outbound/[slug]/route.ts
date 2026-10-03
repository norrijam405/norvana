import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { outboundReferralClicks, products } from "@/db/schema";
import { evaluateAffiliateDestination } from "@/lib/commerce/affiliate-policy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product || product.status !== "active") {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  if (product.commerceModel !== "AFFILIATE_REFERRAL") {
    return NextResponse.json(
      { error: "This product is not an affiliate-referral product." },
      { status: 409 }
    );
  }

  const decision = evaluateAffiliateDestination({
    providerSlug: product.sourceProviderSlug,
    destinationUrl: product.externalCheckoutUrl,
  });

  if (!decision.ok) {
    return NextResponse.json(
      { error: decision.reason, code: decision.code },
      { status: 409 }
    );
  }

  await db.insert(outboundReferralClicks).values({
    productId: product.id,
    providerSlug: decision.provider.slug,
    destinationHost: decision.url.hostname.toLowerCase(),
    commerceModel: "AFFILIATE_REFERRAL",
  });

  return NextResponse.redirect(decision.url, 302);
}
