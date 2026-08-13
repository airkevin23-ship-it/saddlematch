"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HorseshoeIcon } from "@/components/western-icons";
import { APP_NAME } from "@/lib/constants";

export interface LaunchProgress {
  isLaunched: boolean;
  targetMemberCount: number;
  totalQualifying: number;
  yourRank: number | null;
  yourProfileQualifies: boolean;
}

interface LaunchProgressRow {
  is_launched: boolean;
  target_member_count: number;
  total_qualifying: number;
  your_rank: number | null;
  your_profile_qualifies: boolean;
}

/**
 * Pre-launch status for the current user. Pages that should be gated
 * (Discover, Likes, Matches) call this and render <PreLaunchHoldingRoom />
 * in place of their normal content while `status.isLaunched` is false.
 *
 * Deliberately does NOT gate Profile, Settings, or Preferences -- people
 * should be able to keep polishing their profile (and cross the
 * one-photo bar that counts them as a "qualifying" founding member)
 * while they wait.
 */
export function usePreLaunchStatus() {
  const supabase = createClient();
  const [status, setStatus] = useState<LaunchProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_launch_progress").single();
      const row = data as LaunchProgressRow | null;
      if (!error && row) {
        setStatus({
          isLaunched: row.is_launched,
          targetMemberCount: row.target_member_count,
          totalQualifying: row.total_qualifying,
          yourRank: row.your_rank,
          yourProfileQualifies: row.your_profile_qualifies,
        });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, loading };
}

export function PreLaunchHoldingRoom({ status }: { status: LaunchProgress }) {
  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink flex flex-col items-center text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-soft text-brand">
        <HorseshoeIcon className="h-12 w-12" />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold leading-snug">You&rsquo;re in!</h1>

      {status.yourProfileQualifies && status.yourRank ? (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
          You&rsquo;re founding member{" "}
          <span className="font-bold text-ink">#{status.yourRank}</span> of{" "}
          {status.targetMemberCount}. We&rsquo;re holding the doors until Austin has enough
          members for real matches on day one — {status.totalQualifying} of{" "}
          {status.targetMemberCount} so far.
        </p>
      ) : (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
          Add a photo to lock in your spot as a founding member. {status.totalQualifying} of{" "}
          {status.targetMemberCount} spots filled so far — we&rsquo;ll email you the moment{" "}
          {APP_NAME} opens in Austin.
        </p>
      )}

      <p className="mt-3 text-xs font-bold text-brand">
        Founding members get {APP_NAME} Plus free for 3 months at launch.
      </p>

      <Link
        href="/app/profile"
        className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
      >
        {status.yourProfileQualifies ? "Polish your profile" : "Add your photo"}
      </Link>
    </div>
  );
}
