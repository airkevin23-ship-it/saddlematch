import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CITIES } from "@/lib/constants";

// No auth required — this is the pre-signup capture used while a city
// is still being recruited (rodeos, country-music events, western
// bars, local Facebook groups, TikTok) rather than open for signup.
export async function POST(request: Request) {
  const { email, citySlug, source } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) {
    return NextResponse.json({ error: "Pick a valid city" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist_signups").insert({
    email: email.trim().toLowerCase(),
    city_id: city.id,
    source: typeof source === "string" && source ? source : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
