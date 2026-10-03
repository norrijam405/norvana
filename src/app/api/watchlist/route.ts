import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerWatchItems } from "@/db/schema";
import { consumeCustomerVoiceQuota } from "@/lib/customer-voice/throttle";
import {
  attachIntentActorCookie,
  ensureIntentActor,
  readIntentActorHash,
} from "@/lib/customer-intent/identity";
import { parseWatchItemInput } from "@/lib/customer-intent/policy";

export async function GET(req: NextRequest) {
  try {
    const actorKeyHash = readIntentActorHash(req);
    if (!actorKeyHash) return NextResponse.json({ items: [] });

    const items = await db
      .select()
      .from(customerWatchItems)
      .where(
        and(
          eq(customerWatchItems.actorKeyHash, actorKeyHash),
          eq(customerWatchItems.status, "ACTIVE")
        )
      )
      .orderBy(asc(customerWatchItems.createdAt));

    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Customer intent protection is not configured." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  let quota;
  try {
    quota = await consumeCustomerVoiceQuota(req, "WATCH_ITEM_MUTATE");
  } catch {
    return NextResponse.json(
      { error: "Public write protection is not configured." },
      { status: 503 }
    );
  }

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Too many watchlist changes right now. Try again later." },
      { status: 429, headers: { "retry-after": String(quota.retryAfterSeconds) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  let actor;
  try {
    parsed = parseWatchItemInput(body);
    actor = ensureIntentActor(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid watch item." },
      { status: 400 }
    );
  }

  const [item] = await db
    .insert(customerWatchItems)
    .values({
      actorKeyHash: actor.actorKeyHash,
      ...parsed,
      status: "ACTIVE",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        customerWatchItems.actorKeyHash,
        customerWatchItems.targetType,
        customerWatchItems.targetKey,
      ],
      set: {
        alertTypes: parsed.alertTypes,
        priceThresholdCents: parsed.priceThresholdCents,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    })
    .returning();

  const response = NextResponse.json(
    {
      item,
      authority: "CUSTOMER_INTENT_ONLY",
      delivery: "NOT_CONFIGURED_R0",
    },
    { status: 201 }
  );

  return attachIntentActorCookie(response, actor.newCookieValue);
}
