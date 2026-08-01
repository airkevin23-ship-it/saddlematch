import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

// Generates (and caches on the match row) a short "why you two matched"
// blurb based on both profiles' interests and bios.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) {
    return NextResponse.json(
      { error: "This is a Plus feature. Upgrade to see AI match reasoning." },
      { status: 402 }
    );
  }

  const { matchId } = await request.json();
  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, user_a, user_b, match_reason")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.user_a !== user.id && match.user_b !== user.id) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  if (match.match_reason) {
    return NextResponse.json({ reason: match.match_reason });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, display_name, bio, interests")
    .in("id", [user.id, otherId]);

  const me = profiles?.find((p) => p.id === user.id);
  const other = profiles?.find((p) => p.id === otherId);

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Two people matched on a Texas dating app. Write one short, upbeat sentence (under 220 characters) explaining why they might hit it off, based on what they have in common. Be specific, not generic.

Person A — ${me?.display_name}: bio: "${me?.bio || "n/a"}"; interests: ${(me?.interests || []).join(", ") || "n/a"}
Person B — ${other?.display_name}: bio: "${other?.bio || "n/a"}"; interests: ${(other?.interests || []).join(", ") || "n/a"}

Return only the sentence, no preamble.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    await supabase.from("matches").update({ match_reason: text }).eq("id", matchId);

    return NextResponse.json({ reason: text });
  } catch (err) {
    console.error("AI match-reason generation failed", err);
    return NextResponse.json(
      { error: "AI match reasoning is temporarily unavailable." },
      { status: 502 }
    );
  }
}
