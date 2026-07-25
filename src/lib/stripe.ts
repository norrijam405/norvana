import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Only create stripe instance if we have a key
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey)
  : null;

export const STRIPE_CONFIG = {
  currency: "usd",
  paymentMethods: ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
  successUrl: "/confirmation",
  cancelUrl: "/checkout",
};

export function isStripeConfigured(): boolean {
  return !!stripeSecretKey;
}
