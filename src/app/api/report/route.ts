import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reports are logged for manual review — they do NOT auto-hide anyone.
// (Blocking, above, is the immediate self-serve safety action.)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { targetId, reason, details } = await request.json();
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId is required" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ error: "Can't report yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id: targetId,
    reason,
    details: details ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
