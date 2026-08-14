import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAiAccess } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { CITIES } from "@/lib/constants";
import {
  computeCommonGround,
  commonGroundChips,
  hasMeaningfulCommonGround,
  buildPhrasingPrompt,
} from "@/lib/compatibility";

// Common Ground for an existing match.
//
// Same rule as the preview route: the overlap is computed in plain code and
// shown to everyone; the AI-phrased rewrite sits behind hasAiAccess, which
// is free for every member during the launch promo and Plus-only after it
// (see lib/subscription.ts#hasAiAccess). The phrased version is cached on
// the match row so we pay for it once per match rather than once per visit.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select(
      "id, display_name, city_id, interests, relationship_intent, prompts, visible_details"
    )
    .in("id", [user.id, otherId]);

  const me = profiles?.find((p) => p.id === user.id);
  const other = profiles?.find((p) => p.id === otherId);

  if (!other) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const cityName =
    me?.city_id != null && me.city_id === other.city_id
      ? CITIES.find((city) => city.id === other.city_id)?.name ?? null
      : null;

  const ground = computeCommonGround(me ?? {}, other, { cityName });
  const chips = commonGroundChips(ground);

  if (!hasMeaningfulCommonGround(ground)) {
    return NextResponse.json({
      commonGround: [],
      summary: "",
      reason: match.match_reason ?? null,
      aiPhrased: false,
    });
  }

  // Already phrased for this match — reuse it, no second AI call.
  if (match.match_reason) {
    return NextResponse.json({
      commonGround: chips,
      summary: ground.summary,
      reason: match.match_reason,
      aiPhrased: true,
      cached: true,
    });
  }

  const subscribed = await hasAiAccess(user.id);
  if (!subscribed) {
    return NextResponse.json({
      commonGround: chips,
      summary: ground.summary,
      reason: null,
      aiPhrased: false,
      upgradeHint: "Upgrade to Plus for AI-written match insights.",
    });
  }

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: buildPhrasingPrompt(ground.items) }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    let phrases: string[] = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        phrases = parsed.filter((p): p is string => typeof p === "string");
      }
    } catch {
      phrases = [];
    }

    if (phrases.length !== ground.items.length) {
      return NextResponse.json({
        commonGround: chips,
        summary: ground.summary,
        reason: null,
        aiPhrased: false,
      });
    }

    await supabase
      .from("matches")
      .update({ match_reason: ground.summary })
      .eq("id", matchId);

    return NextResponse.json({
      commonGround: phrases,
      summary: ground.summary,
      reason: ground.summary,
      aiPhrased: true,
    });
  } catch (err) {
    console.error("AI match-reason phrasing failed", err);
    return NextResponse.json({
      commonGround: chips,
      summary: ground.summary,
      reason: null,
      aiPhrased: false,
    });
  }
}
