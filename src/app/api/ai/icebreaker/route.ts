import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAiAccess } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

// Suggests 3 opening-message options for a given match.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscribed = await hasAiAccess(user.id);
  if (!subscribed) {
    return NextResponse.json(
      { error: "This is a Plus feature. Upgrade for AI-suggested openers." },
      { status: 402 }
    );
  }

  const { matchId } = await request.json();
  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, user_a, user_b")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.user_a !== user.id && match.user_b !== user.id) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: other } = await supabase
    .from("public_profiles")
    .select("display_name, bio, interests")
    .eq("id", otherId)
    .single();

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Suggest 3 distinct, casual opening messages (each under 140 characters) to send to ${other?.display_name || "a new match"} on a dating app.
Their bio: "${other?.bio || "n/a"}"
Their interests: ${(other?.interests || []).join(", ") || "n/a"}

Rules:
- Reference something specific from their bio or interests in at least one option.
- No generic "hey" or "how's it going."
- No emojis.
- Return as a JSON array of exactly 3 strings, nothing else.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    let suggestions: string[];
    try {
      suggestions = JSON.parse(text);
    } catch {
      // Model didn't return clean JSON — fall back to line-splitting.
      suggestions = text
        .split("\n")
        .map((line) => line.replace(/^[-\d.\s"]+/, "").replace(/"$/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("AI icebreaker generation failed", err);
    return NextResponse.json(
      { error: "AI icebreakers are temporarily unavailable." },
      { status: 502 }
    );
  }
}
