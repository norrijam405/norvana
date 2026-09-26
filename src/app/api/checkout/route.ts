import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { stripe, STRIPE_CONFIG, isStripeConfigured } from "@/lib/stripe";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { db } from "@/db";
import { orders, products } from "@/db/schema";

type CheckoutItemInput = {
  productId: number;
  quantity: number;
};

function generateOrderNumber() {
  return `NRV-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function getSiteUrl() {
  const configured = process.env.NORVANA_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        {
          error: "Checkout is unavailable until payment configuration is verified.",
          code: "NORVANA_PAYMENT_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const siteUrl = getSiteUrl();
    if (!siteUrl) {
      return NextResponse.json(
        { error: "Checkout site URL is not configured.", code: "NORVANA_SITE_URL_REQUIRED" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const customerName = String(body.customerName || "").trim();
    const customerEmail = String(body.customerEmail || "").trim().toLowerCase();
    const shippingAddress = String(body.shippingAddress || "").trim();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName || !customerEmail || !shippingAddress || rawItems.length === 0) {
      return NextResponse.json({ error: "Missing checkout information." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const items: CheckoutItemInput[] = rawItems.map((item: unknown) => {
      const candidate = item as Partial<CheckoutItemInput>;
      return {
        productId: Number(candidate.productId),
        quantity: Number(candidate.quantity),
      };
    });

    if (
      items.some(
        (item) =>
          !Number.isInteger(item.productId) ||
          item.productId <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > 20
      )
    ) {
      return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const catalogRows = await db.select().from(products).where(inArray(products.id, productIds));
    const catalog = new Map(catalogRows.map((product) => [product.id, product]));

    const canonicalItems = items.map((item) => {
      const product = catalog.get(item.productId);
      if (!product || product.status !== "active") {
        throw new Error(`PRODUCT_NOT_AVAILABLE:${item.productId}`);
      }

      return {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        image: product.images?.[0],
        supplierId: product.supplierId || undefined,
        supplierSku: product.supplierSku || undefined,
      };
    });

    const subtotal = Number(
      canonicalItems
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2)
    );
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5;
    const total = Number((subtotal + shipping).toFixed(2));

    const orderNumber = generateOrderNumber();
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName,
        customerEmail,
        shippingAddress,
        items: canonicalItems,
        subtotal,
        shipping,
        total,
        status: "pending",
        paymentStatus: "pending",
      })
      .returning();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      customer_email: customerEmail,
      line_items: canonicalItems.map((item) => ({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shipping * 100),
              currency: STRIPE_CONFIG.currency,
            },
            display_name: shipping === 0 ? "Free Shipping" : "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
      ],
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
      },
      success_url: `${siteUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true`,
    });

    await db
      .update(orders)
      .set({ stripeSessionId: session.id })
      .where(inArray(orders.id, [order.id]));

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pricing: { subtotal, shipping, total, source: "server" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message.startsWith("PRODUCT_NOT_AVAILABLE:")) {
      return NextResponse.json(
        { error: "One or more products are no longer available." },
        { status: 409 }
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
