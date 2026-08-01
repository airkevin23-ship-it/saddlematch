import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

// Creates a Stripe Checkout session for SaddleMatch Plus and returns the URL
// to redirect the browser to. When configured, Stripe applies the introductory
// coupon for the first three billing cycles before the regular $9.99 rate.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripe = getStripeClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const introductoryCoupon = process.env.STRIPE_INTRO_COUPON_ID;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${siteUrl}/app/upgrade?success=1`,
    cancel_url: `${siteUrl}/app/upgrade?canceled=1`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
      ...(introductoryCoupon
        ? { discounts: [{ coupon: introductoryCoupon }] }
        : {}),
    },
  });

  return NextResponse.json({ url: session.url });
}
