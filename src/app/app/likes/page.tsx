"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePreLaunchStatus, PreLaunchHoldingRoom } from "@/components/pre-launch-gate";
import type { PublicProfile } from "@/types/db";
import { CowboyHatIcon, LassoHeartIcon } from "@/components/western-icons";
import { APP_NAME } from "@/lib/constants";

interface LikeRow {
  swipeId: string;
  createdAt: string;
  comment: string | null;
  profile: PublicProfile;
}

// "Likes You" — everyone who has liked the current member and hasn't been
// matched with, blocked, or already swiped on. Free members see a blurred
// teaser (real count, no identities); Plus members see the full list and
// can like back or pass right from here. Matching the freemium split
// PLUS_FEATURES already advertises as "See who liked you".
export default function LikesPage() {
  const { status: launchStatus, loading: launchLoading } = usePreLaunchStatus();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isPlus, setIsPlus] = useState(false);
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: sub }, { data: rawLikes }, { data: myOutgoing }, { data: blockRows }] =
      await Promise.all([
        supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("swipes")
          .select("id, swiper_id, created_at, like_comment")
          .eq("target_id", user.id)
          .eq("action", "like")
          .order("created_at", { ascending: false }),
        supabase.from("swipes").select("target_id").eq("swiper_id", user.id),
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      ]);

    setIsPlus(sub?.status === "active" || sub?.status === "trialing");

    // Exclude anyone already matched, already swiped on (in either
    // direction — swiping "like back" or "pass" here always inserts a
    // fresh row, never updates one, so this also keeps that insert from
    // ever hitting the swipes unique constraint), or blocked.
    const alreadyDecided = new Set((myOutgoing ?? []).map((s) => s.target_id));
    const blockedIds = new Set((blockRows ?? []).map((b) => b.blocked_id));
    const pending = (rawLikes ?? []).filter(
      (s) => !alreadyDecided.has(s.swiper_id) && !blockedIds.has(s.swiper_id)
    );

    if (!pending.length) {
      setLikes([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("*")
      .in("id", pending.map((p) => p.swiper_id));

    const rows: LikeRow[] = pending
      .map((s) => {
        const profile = profiles?.find((p) => p.id === s.swiper_id);
        if (!profile || profile.is_quarantined) return null;
        return { swipeId: s.id, createdAt: s.created_at, comment: s.like_comment, profile };
      })
      .filter((r): r is LikeRow => r !== null);

    setLikes(rows);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(row: LikeRow, action: "like" | "pass") {
    setBusyId(row.swipeId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusyId(null);
      return;
    }

    await supabase.from("swipes").insert({
      swiper_id: user.id,
      target_id: row.profile.id,
      action,
    });

    if (action === "like") {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`user_a.eq.${row.profile.id},user_b.eq.${row.profile.id}`)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle();

      if (match) {
        fetch("/api/notify/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id }),
        }).catch(() => {});
        setToast(`You matched with ${row.profile.display_name}! 🎉`);
        setTimeout(() => setToast(null), 4000);
      }
    }

    setLikes((current) => current.filter((l) => l.swipeId !== row.swipeId));
    setBusyId(null);
  }

  if (launchLoading) {
    return <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink-soft">Loading…</div>;
  }
  if (launchStatus && !launchStatus.isLaunched) {
    return <PreLaunchHoldingRoom status={launchStatus} />;
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink">
      <h1 className="text-xl font-extrabold mb-6 tracking-tight">Likes you</h1>

      {toast && (
        <div className="mb-4 rounded-xl bg-brand-soft border border-brand/30 text-brand-dark text-sm font-semibold px-4 py-3 text-center">
          {toast}
        </div>
      )}

      {loading && <p className="text-ink-soft">Loading…</p>}

      {!loading && likes.length === 0 && (
        <div className="flex flex-col items-center px-2 pt-6 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-soft text-brand">
            <LassoHeartIcon className="h-12 w-12" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold leading-snug text-ink">
            No likes yet — we&rsquo;re here to help
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Real members who like you will show up here. A stronger profile is the fastest way to
            get noticed.
          </p>
          <Link
            href="/app/upgrade"
            className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            Upgrade to {APP_NAME} Plus
          </Link>
          <Link
            href="/app/profile"
            className="mt-3 inline-flex min-h-13 w-full items-center justify-center rounded-full border-2 border-line-strong px-6 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Polish your profile
          </Link>
        </div>
      )}

      {!loading && likes.length > 0 && !isPlus && (
        <div className="flex flex-col items-center px-2 pt-2 text-center">
          <div className="grid grid-cols-3 gap-2.5">
            {likes.slice(0, 6).map((row) => (
              <div
                key={row.swipeId}
                className="aspect-square w-full overflow-hidden rounded-2xl bg-line"
                aria-hidden="true"
              >
                {row.profile.photo_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.profile.photo_urls[0]}
                    alt=""
                    className="h-full w-full object-cover blur-md scale-110"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-ink-faint blur-md">
                    <CowboyHatIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold leading-snug text-ink">
            {likes.length} {likes.length === 1 ? "person likes" : "people like"} you
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Upgrade to {APP_NAME} Plus to see who&rsquo;s interested and match instantly.
          </p>
          <Link
            href="/app/upgrade"
            className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            Upgrade to {APP_NAME} Plus
          </Link>
        </div>
      )}

      {!loading && likes.length > 0 && isPlus && (
        <div className="grid grid-cols-2 gap-3">
          {likes.map((row) => (
            <div
              key={row.swipeId}
              className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm shadow-black/[0.03]"
            >
              <div className="aspect-square w-full overflow-hidden bg-line">
                {row.profile.photo_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.profile.photo_urls[0]}
                    alt={row.profile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-ink-faint">
                    <CowboyHatIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-bold flex items-center gap-1.5">
                  {row.profile.display_name}, {row.profile.age}
                  {row.profile.is_demo && (
                    <span className="bg-ink text-cream text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                      Demo
                    </span>
                  )}
                </p>
                {row.comment && (
                  <p className="mt-1 line-clamp-2 text-xs italic leading-snug text-ink-soft">
                    &ldquo;{row.comment}&rdquo;
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(row, "pass")}
                    disabled={busyId === row.swipeId}
                    aria-label={`Pass on ${row.profile.display_name}`}
                    className="grid min-h-9 flex-1 place-items-center rounded-full border border-line-strong text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(row, "like")}
                    disabled={busyId === row.swipeId}
                    aria-label={`Like ${row.profile.display_name} back`}
                    className="grid min-h-9 flex-1 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  >
                    ♥
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
