import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAiAccess } from "@/lib/subscription";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

// Suggests a short, specific answer to a single Hinge-style prompt.
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
      { error: "This is a Plus feature. Upgrade to use the AI prompt writer." },
      { status: 402 }
    );
  }

  const { question, city, interests, notes } = await request.json();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `A dating app profile prompt is: "${question}"

Write one short, specific, genuine answer (under 150 characters) for someone who lives in ${city || "Texas"}.
Interests: ${Array.isArray(interests) && interests.length ? interests.join(", ") : "not specified"}.
Notes from the person: ${notes || "none provided"}.

Rules:
- First person, casual, specific — not a generic dating-app cliché.
- No emojis.
- Return only the answer text, nothing else.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("AI prompt-answer generation failed", err);
    return NextResponse.json(
      { error: "AI prompt writer is temporarily unavailable." },
      { status: 502 }
    );
  }
}
