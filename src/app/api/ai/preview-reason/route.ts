import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { CITIES } from "@/lib/constants";
import {
  computeCommonGround,
  commonGroundChips,
  hasMeaningfulCommonGround,
  buildPhrasingPrompt,
} from "@/lib/compatibility";

// Common Ground shown BEFORE deciding to like/pass.
//
// The overlap itself is computed in plain code and returned to everyone —
// it costs nothing, so gating it would be gating arithmetic. Plus members
// additionally get the AI-phrased version, where the model only rephrases
// the list we already computed. Free users therefore never trigger an
// Anthropic call from this route.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { candidateId } = await request.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select(
      "id, display_name, city_id, interests, relationship_intent, prompts, visible_details"
    )
    .in("id", [user.id, candidateId]);

  const me = profiles?.find((p) => p.id === user.id);
  const other = profiles?.find((p) => p.id === candidateId);

  if (!other) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const cityName =
    me?.city_id != null && me.city_id === other.city_id
      ? CITIES.find((city) => city.id === other.city_id)?.name ?? null
      : null;

  const ground = computeCommonGround(me ?? {}, other, { cityName });
  const chips = commonGroundChips(ground);

  // Nothing real to point at — say so rather than inventing warmth.
  if (!hasMeaningfulCommonGround(ground)) {
    return NextResponse.json({
      commonGround: [],
      summary: "",
      reason: null,
      aiPhrased: false,
    });
  }

  const subscribed = await hasActiveSubscription(user.id);
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

    // The model must return one phrase per item. If it didn't, fall back to
    // the computed chips instead of showing a mismatched list.
    if (phrases.length !== ground.items.length) {
      return NextResponse.json({
        commonGround: chips,
        summary: ground.summary,
        reason: null,
        aiPhrased: false,
      });
    }

    return NextResponse.json({
      commonGround: phrases,
      summary: ground.summary,
      reason: ground.summary,
      aiPhrased: true,
    });
  } catch (err) {
    console.error("AI preview-reason phrasing failed", err);
    // Never fail the request over the AI — the real overlap still stands.
    return NextResponse.json({
      commonGround: chips,
      summary: ground.summary,
      reason: null,
      aiPhrased: false,
    });
  }
}
