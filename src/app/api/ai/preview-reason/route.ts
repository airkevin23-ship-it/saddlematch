import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

// Coffee Meets Bagel style: a short "why you two might click" blurb
// shown BEFORE deciding to like/pass, not after matching.
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
      { error: "This is a Plus feature. Upgrade to see AI compatibility notes." },
      { status: 402 }
    );
  }

  const { candidateId } = await request.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, display_name, bio, interests, prompts")
    .in("id", [user.id, candidateId]);

  const me = profiles?.find((p) => p.id === user.id);
  const other = profiles?.find((p) => p.id === candidateId);

  if (!other) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Two people are looking at each other's dating profiles on a Texas app, before deciding to like or pass. Write one short, upbeat sentence (under 200 characters) suggesting why they might click, based on specifics — not generic flattery.

Person A — ${me?.display_name}: interests: ${(me?.interests || []).join(", ") || "n/a"}; prompts: ${JSON.stringify(me?.prompts || [])}
Person B — ${other.display_name}: interests: ${(other.interests || []).join(", ") || "n/a"}; prompts: ${JSON.stringify(other.prompts || [])}

Return only the sentence, no preamble.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reason: text });
  } catch (err) {
    console.error("AI preview-reason generation failed", err);
    return NextResponse.json(
      { error: "AI reasoning is temporarily unavailable." },
      { status: 502 }
    );
  }
}
