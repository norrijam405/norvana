import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = parseInt(session.metadata?.orderId || "0");

        if (orderId) {
          // Update order status
          await db
            .update(orders)
            .set({
              paymentStatus: "paid",
              status: "processing",
              stripePaymentIntentId: session.payment_intent as string,
            })
            .where(eq(orders.id, orderId));

          // Record payment
          await db.insert(payments).values({
            orderId,
            stripePaymentIntentId: session.payment_intent as string,
            stripeSessionId: session.id,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "succeeded",
            customerEmail: session.customer_email || "",
            receiptUrl: "", // Will be updated by payment_intent.succeeded
          });

          console.log(`✅ Order ${orderId} payment completed`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment record with receipt URL if available
        const charges = paymentIntent.latest_charge;
        if (typeof charges === "string") {
          const charge = await stripe.charges.retrieve(charges);
          if (charge.receipt_url) {
            await db
              .update(payments)
              .set({ receiptUrl: charge.receipt_url })
              .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find and update order
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

        if (order) {
          await db
            .update(orders)
            .set({ paymentStatus: "failed" })
            .where(eq(orders.id, order.id));

          console.log(`❌ Order ${order.id} payment failed`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.stripePaymentIntentId, paymentIntentId));

          if (order) {
            await db
              .update(orders)
              .set({ paymentStatus: "refunded", status: "cancelled" })
              .where(eq(orders.id, order.id));

            await db
              .update(payments)
              .set({ status: "refunded" })
              .where(eq(payments.stripePaymentIntentId, paymentIntentId));

            console.log(`💰 Order ${order.id} refunded`);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
