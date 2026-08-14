import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAiAccess } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

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
      { error: "This is a Plus feature. Upgrade to use the AI bio writer." },
      { status: 402 }
    );
  }

  const { displayName, city, interests, notes } = await request.json();

  if (!displayName || !city) {
    return NextResponse.json(
      { error: "displayName and city are required" },
      { status: 400 }
    );
  }

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Write a short, warm, genuine dating-app bio (2-4 sentences, under 400 characters) for someone named ${displayName} who lives in ${city}, Texas.
Interests: ${Array.isArray(interests) && interests.length ? interests.join(", ") : "not specified"}.
Notes from the person about themselves: ${notes || "none provided"}.

Rules:
- First person, casual, confident but not arrogant.
- No clichés like "adventure seeker" or "love to laugh."
- Mention the city naturally at most once.
- Do not use emojis.
- Return only the bio text, nothing else.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ bio: text });
  } catch (err) {
    console.error("AI bio generation failed", err);
    return NextResponse.json(
      { error: "AI bio writer is temporarily unavailable." },
      { status: 502 }
    );
  }
}
