import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewEvents, reviewReactions, reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const ACTOR_COOKIE = "norvana_review_actor";

function actorHash(actorId: string) {
  return createHash("sha256").update(actorId).digest("hex");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const reviewId = Number(id);
  if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Valid review id is required." }, { status: 400 });
  }

  const body = (await req.json()) as { reaction?: string };
  const reaction =
    body.reaction === "HELPFUL"
      ? "HELPFUL"
      : body.reaction === "NOT_HELPFUL"
        ? "NOT_HELPFUL"
        : null;

  if (!reaction) {
    return NextResponse.json(
      { error: "reaction must be HELPFUL or NOT_HELPFUL." },
      { status: 400 }
    );
  }

  const [review] = await db
    .select({ id: reviews.id, moderationState: reviews.moderationState })
    .from(reviews)
    .where(eq(reviews.id, reviewId));

  if (!review || review.moderationState !== "PUBLISHED") {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const existingActor = req.cookies.get(ACTOR_COOKIE)?.value;
  const actorId = existingActor || randomUUID();
  const hash = actorHash(actorId);

  const counts = await db.transaction(async (tx) => {
    await tx
      .insert(reviewReactions)
      .values({
        reviewId,
        actorKeyHash: hash,
        reaction,
      })
      .onConflictDoUpdate({
        target: [reviewReactions.reviewId, reviewReactions.actorKeyHash],
        set: {
          reaction,
          updatedAt: new Date(),
        },
      });

    const result = await tx.execute(sql`
      UPDATE reviews
      SET
        helpful_count = (
          SELECT COUNT(*) FROM review_reactions
          WHERE review_id = ${reviewId} AND reaction = 'HELPFUL'
        ),
        not_helpful_count = (
          SELECT COUNT(*) FROM review_reactions
          WHERE review_id = ${reviewId} AND reaction = 'NOT_HELPFUL'
        ),
        updated_at = now()
      WHERE id = ${reviewId}
      RETURNING helpful_count, not_helpful_count
    `);

    await tx.insert(reviewEvents).values({
      reviewId,
      eventType: "REACTION_RECORDED",
      payload: { reaction },
    });

    const row = result.rows[0] as
      | { helpful_count: number; not_helpful_count: number }
      | undefined;

    return {
      helpfulCount: Number(row?.helpful_count ?? 0),
      notHelpfulCount: Number(row?.not_helpful_count ?? 0),
    };
  });

  const response = NextResponse.json({ reviewId, reaction, ...counts });
  if (!existingActor) {
    response.cookies.set(ACTOR_COOKIE, actorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
