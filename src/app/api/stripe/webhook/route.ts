import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook — the only writer of the `subscriptions` table.
// Configure this URL (https://yourdomain.com/api/stripe/webhook) in the
// Stripe Dashboard and subscribe to the events listed below.
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  async function upsertFromSubscription(subscription: Stripe.Subscription) {
    const customerObj =
      typeof subscription.customer === "string" ? null : subscription.customer;
    const customerMetadata =
      customerObj && !customerObj.deleted ? customerObj.metadata : undefined;

    const userId =
      subscription.metadata?.supabase_user_id ||
      customerMetadata?.supabase_user_id;

    if (!userId) {
      // Fall back to looking up by customer ID if metadata wasn't set.
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (!existing) {
        console.error("Could not resolve Supabase user for subscription", subscription.id);
        return;
      }

      await supabase.from("subscriptions").upsert({
        user_id: existing.user_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(
          subscription.items.data[0]?.current_period_end * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(
        subscription.items.data[0]?.current_period_end * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (userId && customerId) {
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id:
            typeof session.subscription === "string" ? session.subscription : null,
          status: "active",
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertFromSubscription(subscription);
      break;
    }

    default:
      // Unhandled event types are ignored.
      break;
  }

  return NextResponse.json({ received: true });
}
