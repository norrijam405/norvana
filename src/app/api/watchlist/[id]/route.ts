import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerWatchItems } from "@/db/schema";
import { consumeCustomerVoiceQuota } from "@/lib/customer-voice/throttle";
import { readIntentActorHash } from "@/lib/customer-intent/identity";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  let actorKeyHash: string | null;
  try {
    actorKeyHash = readIntentActorHash(req);
  } catch {
    return NextResponse.json(
      { error: "Customer intent protection is not configured." },
      { status: 503 }
    );
  }

  if (!actorKeyHash) return NextResponse.json({ removed: false }, { status: 404 });

  const { id } = await params;
  const watchId = Number(id);
  if (!Number.isInteger(watchId) || watchId <= 0) {
    return NextResponse.json({ error: "Invalid watch item id." }, { status: 400 });
  }

  const [removed] = await db
    .update(customerWatchItems)
    .set({ status: "REMOVED", updatedAt: new Date() })
    .where(
      and(
        eq(customerWatchItems.id, watchId),
        eq(customerWatchItems.actorKeyHash, actorKeyHash)
      )
    )
    .returning({ id: customerWatchItems.id });

  if (!removed) return NextResponse.json({ removed: false }, { status: 404 });
  return NextResponse.json({ removed: true, id: removed.id });
}
