import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Blocking is one-directional to record but hides in both directions
// everywhere it's read (see daily-queue's blockedIds lookup).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { targetId } = await request.json();
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId is required" }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ error: "Can't block yourself" }, { status: 400 });
  }

  const { error } = await supabase
    .from("blocks")
    .upsert(
      { blocker_id: user.id, blocked_id: targetId },
      { onConflict: "blocker_id,blocked_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
