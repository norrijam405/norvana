import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateOrderNumber() {
  const prefix = "NRV";
  const num = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customerName, customerEmail, shippingAddress, subtotal, shipping, total } = body;

    // Create order first
    const orderNumber = generateOrderNumber();
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName,
        customerEmail,
        shippingAddress,
        items,
        subtotal,
        shipping,
        total,
        status: "pending",
        paymentStatus: isStripeConfigured() ? "pending" : "unpaid",
      })
      .returning();

    // If Stripe is not configured, return fallback order
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json({ 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        fallback: true,
        message: "Order created without payment (Stripe not configured)"
      });
    }

    // Get the base URL
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      customer_email: customerEmail,
      line_items: items.map((item: { name: string; price: number; quantity: number }) => ({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
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
      success_url: `${origin}/confirmation?order=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
    });

    // Update order with session ID
    await db
      .update(orders)
      .set({ stripeSessionId: session.id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
