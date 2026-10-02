import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviewEvents, reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  reviewVisibilityDecision,
  validateReviewSubmission,
} from "@/lib/customer-voice/policy";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.rightsConfirmed !== true) {
      return NextResponse.json(
        {
          error:
            "External review import requires explicit confirmation that Norvana is authorized to display/syndicate the review.",
        },
        { status: 400 }
      );
    }

    const sourceLabel =
      typeof body.sourceLabel === "string" ? body.sourceLabel.trim().slice(0, 255) : "";
    const sourceReviewId =
      typeof body.sourceReviewId === "string"
        ? body.sourceReviewId.trim().slice(0, 255)
        : "";
    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim().slice(0, 1000) : null;

    if (!sourceLabel || !sourceReviewId) {
      return NextResponse.json(
        { error: "sourceLabel and sourceReviewId are required." },
        { status: 400 }
      );
    }

    const parsed = validateReviewSubmission({
      productId: body.productId,
      author: body.author,
      rating: body.rating,
      fulfillmentRating: body.fulfillmentRating,
      purchaseExperienceRating: body.purchaseExperienceRating,
      title: body.title,
      body: body.body,
      buyerType: body.buyerType,
      businessName: body.businessName,
    });

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.reason }, { status: 400 });
    }

    const input = parsed.value;
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, input.productId));

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const purchaseVerified = body.purchaseVerified === true;
    const visibility = reviewVisibilityDecision();

    const review = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(reviews)
        .values({
          productId: input.productId,
          author: input.author,
          rating: input.rating,
          fulfillmentRating: input.fulfillmentRating,
          purchaseExperienceRating: input.purchaseExperienceRating,
          title: input.title,
          body: input.body,
          verified: purchaseVerified,
          buyerType: input.buyerType,
          businessName: input.businessName,
          verificationState: purchaseVerified ? "EXTERNAL_PURCHASE" : "UNVERIFIED",
          moderationState: visibility.moderationState,
          sourceChannel: "EXTERNAL",
          sourceLabel,
          sourceReviewId,
          sourceUrl,
        })
        .returning();

      await tx.insert(reviewEvents).values({
        reviewId: created.id,
        eventType: "EXTERNAL_REVIEW_IMPORTED",
        payload: {
          sourceLabel,
          sourceReviewId,
          purchaseVerified,
          rightsConfirmed: true,
        },
      });

      await tx.execute(sql`
        UPDATE products SET
          review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = ${input.productId}
              AND moderation_state = 'PUBLISHED'
          ),
          rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE product_id = ${input.productId}
              AND moderation_state = 'PUBLISHED'
          )
        WHERE id = ${input.productId}
      `);

      return created;
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("reviews_external_source_id_idx")) {
      return NextResponse.json(
        { error: "That external review has already been imported." },
        { status: 409 }
      );
    }

    console.error("External review import error:", error);
    return NextResponse.json({ error: "Failed to import external review." }, { status: 500 });
  }
}
