import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DAILY_QUEUE_SIZE } from "@/lib/constants";

// Coffee Meets Bagel / Crush style: instead of an infinite swipe deck,
// each user gets a small, capped, once-a-day queue of candidates.
// Revisiting the same day returns the same queue (minus anyone they've
// since swiped on); a new day rolls a fresh batch.
export async function GET(request: Request) {
    const supabase = await createClient();
    const {
          data: { user },
    } = await supabase.auth.getUser();

  if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: me } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (!me) {
        return NextResponse.json({ error: "Finish your profile first." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
    const searchParams = new URL(request.url).searchParams;
    const filteredMinAge = Number(searchParams.get("minAge")) || me.min_age || 18;
    const filteredMaxAge = Number(searchParams.get("maxAge")) || me.max_age || 99;
    const filteredGenders = searchParams.get("genders")?.split(",").filter(Boolean) ?? [];
    const hasTemporaryFilters = searchParams.has("minAge") || searchParams.has("maxAge") || searchParams.has("genders");

  const { data: swiped } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("swiper_id", user.id);

  const swipedIds = new Set((swiped ?? []).map((s) => s.target_id));

  // Blocks apply in both directions: hide anyone I've blocked, and
  // hide anyone who has blocked me.
  const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
        supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id),
      ]);
    const blockedIds = new Set([
          ...(iBlocked ?? []).map((b) => b.blocked_id),
          ...(blockedMe ?? []).map((b) => b.blocker_id),
        ]);

  const { data: existingQueue } = await supabase
      .from("daily_queues")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  let candidateIds: string[];

  if (!hasTemporaryFilters && existingQueue && existingQueue.queue_date === today) {
        candidateIds = existingQueue.candidate_ids.filter(
                (id: string) => !swipedIds.has(id) && !blockedIds.has(id)
              );
  } else {
        const excludeIds = [user.id, ...swipedIds, ...blockedIds];

      // Reads from public_profiles (not profiles directly) so this
      // never touches other members' birthdates — only what's safe
      // to see about someone else.
      let query = supabase
          .from("public_profiles")
          .select("id")
          .eq("city_id", me.city_id)
          .eq("is_active", true)
          .eq("is_quarantined", false)
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(DAILY_QUEUE_SIZE * 3);

      const genders = filteredGenders.length ? filteredGenders : me.interested_in;
        if (genders?.length) {
                query = query.in("gender", genders);
        }
        query = query.gte("age", filteredMinAge).lte("age", filteredMaxAge);

      const { data: pool } = await query;
        const shuffled = (pool ?? []).map((p) => p.id).sort(() => Math.random() - 0.5);
        candidateIds = shuffled.slice(0, DAILY_QUEUE_SIZE);

      if (!hasTemporaryFilters) {
              await supabase.from("daily_queues").upsert({
                        user_id: user.id,
                        queue_date: today,
                        candidate_ids: candidateIds,
                        updated_at: new Date().toISOString(),
              });
      }
  }

  if (candidateIds.length === 0) {
        return NextResponse.json({ candidates: [] });
  }

  const { data: candidates, error } = await supabase
      .from("public_profiles")
      .select("*")
      .in("id", candidateIds);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Preserve queue order.
  const ordered = candidateIds
      .map((id) => candidates?.find((c) => c.id === id))
      .filter(Boolean);

  return NextResponse.json({ candidates: ordered });
}
