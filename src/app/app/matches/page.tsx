"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/types/db";
import { CowboyHatIcon } from "@/components/western-icons";

interface MatchRow {
  id: string;
  created_at: string;
  otherProfile: PublicProfile;
}

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink">
      <h1 className="text-xl font-extrabold mb-6 tracking-tight">Your matches</h1>

      {loading && <p className="text-ink-soft">Loading…</p>}

      {!loading && matches.length === 0 && (
        <p className="text-ink-soft text-sm">
          No matches yet — check today&rsquo;s roundup on Discover.
        </p>
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
              ) : (
                <CowboyHatIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="font-bold flex items-center gap-1.5">
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
