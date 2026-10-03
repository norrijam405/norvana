import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketRequests } from "@/db/schema";
import { consumeCustomerVoiceQuota } from "@/lib/customer-voice/throttle";

const CATEGORIES = new Set(["product", "farm", "maker", "category"]);

function normalizeTitle(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function normalizeNote(value: unknown) {
  return String(value || "").trim().slice(0, 500);
}

function requestKey(category: string, title: string) {
  return createHash("sha256")
    .update(category + "|" + title.toLocaleLowerCase("en-US"))
    .digest("hex");
}

export async function GET() {
  const rows = await db
    .select({
      title: marketRequests.title,
      category: marketRequests.category,
      requestCount: marketRequests.requestCount,
      status: marketRequests.status,
    })
    .from(marketRequests)
    .orderBy(desc(marketRequests.requestCount), desc(marketRequests.updatedAt))
    .limit(12);

  return NextResponse.json({ requests: rows }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let quota;
  try {
    quota = await consumeCustomerVoiceQuota(req, "MARKET_REQUEST");
  } catch {
    return NextResponse.json(
      { error: "Public request protection is not configured." },
      { status: 503 }
    );
  }

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Too many requests right now. Try again later." },
      {
        status: 429,
        headers: { "retry-after": String(quota.retryAfterSeconds) },
      }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = normalizeTitle(body.title);
  const category = String(body.category || "product");
  const note = normalizeNote(body.note);

  if (title.length < 2 || !CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Add a valid name and request type." }, { status: 400 });
  }

  const key = requestKey(category, title);
  const [existing] = await db
    .select()
    .from(marketRequests)
    .where(eq(marketRequests.requestKey, key))
    .limit(1);

  if (existing) {
    const nextCount = existing.requestCount + 1;
    await db
      .update(marketRequests)
      .set({
        requestCount: nextCount,
        updatedAt: new Date(),
        note: existing.note || note,
      })
      .where(eq(marketRequests.id, existing.id));

    return NextResponse.json({
      accepted: true,
      requestCount: nextCount,
      status: existing.status,
      message: "Someone else wants this too. We counted your demand signal.",
      authority: "OBSERVE_RECOMMEND_ONLY",
    });
  }

  const [created] = await db
    .insert(marketRequests)
    .values({
      requestKey: key,
      title,
      category,
      note,
      requestCount: 1,
      status: "REQUESTED",
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json(
    {
      accepted: true,
      requestCount: created.requestCount,
      status: created.status,
      message: "Request planted. It can now become sourcing evidence.",
      authority: "OBSERVE_RECOMMEND_ONLY",
    },
    { status: 201 }
  );
}
