import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

// Admin-only proof that the Anthropic integration actually works.
//
// Every other AI route swallows failures on purpose: if the model call fails,
// the user still gets computed chips or a plain empty state rather than an
// error. That is right for users and useless for debugging, because a missing
// key, a retired model and a network blip all look identical from outside.
//
// This route does the opposite. It makes one real, tiny call and reports
// exactly what came back, including the resolved model ID, which is how you
// confirm a dateless alias like "claude-sonnet-4-5" still points somewhere.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  // 404 rather than 403: a diagnostic endpoint should not confirm it exists
  // to anyone who is not allowed to use it.
  if (!user || !adminEmail || user.email?.trim().toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, stage: "config", error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 }
    );
  }

  const startedAt = Date.now();

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with the single word: saddle" }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return NextResponse.json({
      ok: true,
      stage: "anthropic",
      configuredModel: AI_MODEL,
      resolvedModel: message.model,
      reply: text,
      inputTokens: message.usage?.input_tokens ?? null,
      outputTokens: message.usage?.output_tokens ?? null,
      ms: Date.now() - startedAt,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; name?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        stage: "anthropic",
        configuredModel: AI_MODEL,
        status: e?.status ?? null,
        name: e?.name ?? null,
        error: e?.message ?? String(err),
        ms: Date.now() - startedAt,
      },
      { status: 502 }
    );
  }
}
