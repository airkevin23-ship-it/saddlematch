import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}
