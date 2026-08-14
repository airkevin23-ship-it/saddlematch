"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/types/db";
import { usePreLaunchStatus, PreLaunchHoldingRoom } from "@/components/pre-launch-gate";

interface MatchRow {
  id: string;
  created_at: string;
  otherProfile: PublicProfile;
}

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { status: launchStatus, loading: launchLoading } = usePreLaunchStatus();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rawMatches } = await supabase
        .from("matches")
        .select("id, user_a, user_b, created_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!rawMatches?.length) {
        setLoading(false);
        return;
      }

      const otherIds = rawMatches.map((m) =>
        m.user_a === user.id ? m.user_b : m.user_a
      );

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("*")
        .in("id", otherIds);

      const rows: MatchRow[] = rawMatches
        .map((m) => {
          const otherId = m.user_a === user.id ? m.user_b : m.user_a;
          const otherProfile = profiles?.find((p) => p.id === otherId);
          if (!otherProfile) return null;
          return { id: m.id, created_at: m.created_at, otherProfile };
        })
        .filter((r): r is MatchRow => r !== null);

      setMatches(rows);
      setLoading(false);
    })();
  }, [supabase]);

  if (launchLoading) {
    return <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink-soft">Loading…</div>;
  }
  if (launchStatus && !launchStatus.isLaunched) {
    return <PreLaunchHoldingRoom status={launchStatus} />;
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink">
      <h1 className="font-serif-heading text-xl font-bold mb-6 tracking-tight">Your matches</h1>

      {loading && <p className="text-ink-soft">Loading…</p>}

      {!loading && matches.length === 0 && (
        <div className="rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-base font-bold leading-relaxed text-ink">
            No real matches yet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Likes on clearly marked sample profiles are only for exploring the app.
            When you and a real member like each other, your conversation will appear here.
          </p>
          <Link
            href="/app/discover"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
          >
            View today&rsquo;s picks
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/app/matches/${m.id}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-card shadow-sm shadow-black/[0.03] p-3 hover:border-line-strong transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-line flex items-center justify-center text-xl overflow-hidden shrink-0 relative">
              {m.otherProfile.photo_urls?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.otherProfile.photo_urls[0]}
                  alt={m.otherProfile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="font-rounded font-bold flex items-center gap-1.5">
                {m.otherProfile.display_name}, {m.otherProfile.age}
                {m.otherProfile.is_demo && (
                  <span className="bg-ink text-cream text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                    Demo
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-soft">
                Matched {new Date(m.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
