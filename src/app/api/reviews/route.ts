import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, reviewEvents, reviews } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  containsProduct,
  productQuantityFromOrder,
  purchaseQuantityBand,
  reviewVisibilityDecision,
  validateReviewSubmission,
} from "@/lib/customer-voice/policy";
import { consumeCustomerVoiceQuota } from "@/lib/customer-voice/throttle";

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Valid productId is required." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(reviews)
    .where(sql`${reviews.productId} = ${productId} AND ${reviews.moderationState} = 'PUBLISHED'`)
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json(
    { reviews: rows, refreshedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const quota = await consumeCustomerVoiceQuota(req, "REVIEW_SUBMIT");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Too many review submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(quota.retryAfterSeconds) },
        }
      );
    }
    const parsed = validateReviewSubmission(await req.json());
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

    let verified = false;
    let verificationState = "UNVERIFIED";
    let sourceOrderId: number | null = null;
    let purchaseQuantityBandValue: string | null = null;
    let repeatBuyer: boolean | null = null;

    if (input.orderNumber && input.purchaseEmail) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, input.orderNumber));

      const purchaseMatches =
        order &&
        order.paymentStatus === "paid" &&
        order.customerEmail.trim().toLowerCase() === input.purchaseEmail &&
        containsProduct(order.items, input.productId);

      if (!purchaseMatches) {
        return NextResponse.json(
          {
            error:
              "We could not verify that paid order for this product. The review was not submitted.",
          },
          { status: 422 }
        );
      }

      verified = true;
      verificationState = "NORVANA_PURCHASE";
      sourceOrderId = order.id;
      purchaseQuantityBandValue = purchaseQuantityBand(
        productQuantityFromOrder(order.items, input.productId)
      );

      const customerOrders = await db
        .select({
          id: orders.id,
          paymentStatus: orders.paymentStatus,
        })
        .from(orders)
        .where(eq(orders.customerEmail, input.purchaseEmail));

      repeatBuyer =
        customerOrders.filter((candidate) => candidate.paymentStatus === "paid").length > 1;
    }

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
          verified,
          buyerType: input.buyerType,
          businessName: input.businessName,
          purchaseQuantityBand: purchaseQuantityBandValue,
          repeatBuyer,
          verificationState,
          moderationState: visibility.moderationState,
          sourceChannel: "NORVANA",
          sourceLabel: "Norvana",
          sourceOrderId,
        })
        .returning();

      await tx.insert(reviewEvents).values({
        reviewId: created.id,
        eventType: "REVIEW_SUBMITTED",
        payload: {
          verificationState,
          buyerType: input.buyerType,
          purchaseQuantityBand: purchaseQuantityBandValue,
          repeatBuyer,
          moderationState: visibility.moderationState,
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

    return NextResponse.json(
      {
        review,
        verification: {
          state: verificationState,
          verified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("reviews_verified_order_product_idx")) {
      return NextResponse.json(
        { error: "This paid order already has a review for this product." },
        { status: 409 }
      );
    }

    console.error("Reviews POST error:", error);
    return NextResponse.json({ error: "Failed to create review." }, { status: 500 });
  }
}
