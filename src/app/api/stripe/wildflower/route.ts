import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

// A Wildflower is a one-time, paid signal of extra interest. The checkout
// creates the $5 line item directly so it does not depend on a copied price ID.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { targetId } = await request.json();
  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "Choose another member first." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "SaddleMatch Wildflower", description: "A one-time extra-interest signal" },
        unit_amount: 500,
      },
      quantity: 1,
    }],
    success_url: `${siteUrl}/app/discover?wildflower=sent`,
    cancel_url: `${siteUrl}/app/discover?wildflower=canceled`,
    metadata: { type: "wildflower", supabase_user_id: user.id, target_id: targetId },
  });

  return NextResponse.json({ url: session.url });
}
