"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Message, PublicProfile } from "@/types/db";

export default function MatchThreadPage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<PublicProfile | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [matchReason, setMatchReason] = useState<string | null>(null);
  const [sharedTraits, setSharedTraits] = useState<string[] | null>(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: match } = await supabase
      .from("matches")
      .select("id, user_a, user_b, match_reason, match_shared_traits")
      .eq("id", matchId)
      .single();

    if (!match) return;

    setMatchReason(match.match_reason);
    setSharedTraits(match.match_shared_traits);

    const otherId = match.user_a === user.id ? match.user_b : match.user_a;
    const { data: other } = await supabase
      .from("public_profiles")
      .select("*")
      .eq("id", otherId)
      .single();
    setOtherProfile(other);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  async function sendMessage(text: string) {
    if (!text.trim() || !userId) return;
    const { data, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: userId,
        body: text.trim(),
      })
      .select("id")
      .single();
    if (!error) {
      setBody("");
      if (data) {
        // Best-effort — a failed notification should never block sending.
        fetch("/api/notify/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: data.id }),
        }).catch(() => {});
      }
    }
  }

  async function handleBlock() {
    if (!otherProfile) return;
    if (!confirm(`Block ${otherProfile.display_name}? You won't see each other again.`)) return;
    setSafetyBusy(true);
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: otherProfile.id }),
    });
    setSafetyBusy(false);
    setSafetyMessage("Blocked.");
  }

  async function handleReport() {
    if (!otherProfile) return;
    const reason = prompt(
      "What's going on? (e.g. fake profile, harassment, inappropriate photo)"
    );
    if (!reason) return;
    setSafetyBusy(true);
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: otherProfile.id, reason }),
    });
    setSafetyBusy(false);
    setSafetyMessage("Reported. Our team will review it.");
  }

  async function handleGetReason() {
    setReasonLoading(true);
    setUpgradeNeeded(false);
    const res = await fetch("/api/ai/match-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    const data = await res.json();
    if (res.status === 402) {
      setUpgradeNeeded(true);
    } else if (res.ok) {
      if (data.shared?.length > 0) {
        setSharedTraits(data.shared);
      } else {
        setMatchReason(data.reason);
      }
    }
    setReasonLoading(false);
  }

  async function handleGetSuggestions() {
    setSuggestionsLoading(true);
    setUpgradeNeeded(false);
    const res = await fetch("/api/ai/icebreaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    const data = await res.json();
    if (res.status === 402) {
      setUpgradeNeeded(true);
    } else if (res.ok) {
      setSuggestions(data.suggestions);
    }
    setSuggestionsLoading(false);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-8 flex flex-col h-[calc(100vh-64px)] bg-cream text-ink">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-1.5">
            {otherProfile
              ? `${otherProfile.display_name}, ${otherProfile.age}`
              : "Loading…"}
            {otherProfile?.is_demo && (
              <span className="bg-ink text-cream text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </h1>
          {otherProfile && (
            <div className="flex items-center gap-3 shrink-0 pt-1">
              <button
                onClick={handleReport}
                disabled={safetyBusy}
                className="text-[11px] text-ink-faint hover:text-ink-soft font-medium disabled:opacity-50"
              >
                Report
              </button>
              <button
                onClick={handleBlock}
                disabled={safetyBusy}
                className="text-[11px] text-ink-faint hover:text-red-600 font-medium disabled:opacity-50"
              >
                Block
              </button>
            </div>
          )}
        </div>
        {safetyMessage && (
          <p className="text-xs text-ink-soft mt-1">{safetyMessage}</p>
        )}

        {sharedTraits && sharedTraits.length > 0 ? (
          <div className="mt-1 rounded-lg bg-brand-soft/60 px-2.5 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">You both</p>
            <ul className="mt-1 space-y-0.5">
              {sharedTraits.map((trait, i) => (
                <li key={i} className="text-sm text-brand-dark">✓ {trait}</li>
              ))}
            </ul>
          </div>
        ) : matchReason ? (
          <p className="text-sm text-brand-dark mt-1">{matchReason}</p>
        ) : (
          <button
            onClick={handleGetReason}
            disabled={reasonLoading}
            className="text-xs text-brand hover:text-brand-dark font-semibold mt-1 disabled:opacity-50"
          >
            {reasonLoading ? "Thinking…" : "✨ What you have in common (AI, Plus)"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {messages.length === 0 && (
          <p className="text-ink-faint text-sm text-center mt-10">
            Say hi to {otherProfile?.display_name ?? "your match"}.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
              m.sender_id === userId
                ? "bg-brand text-white ml-auto"
                : "bg-card border border-line text-ink"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="mb-3">
          {suggestions ? (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-sm bg-card border border-line rounded-xl px-3 py-2 hover:border-brand/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleGetSuggestions}
              disabled={suggestionsLoading}
              className="text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
            >
              {suggestionsLoading
                ? "Thinking…"
                : "✨ Suggest an opening message (AI, Plus)"}
            </button>
          )}
        </div>
      )}

      {upgradeNeeded && (
        <p className="text-xs text-ink-soft mb-2">
          That&rsquo;s a Plus feature.{" "}
          <a href="/app/upgrade" className="text-brand hover:text-brand-dark font-semibold">
            Upgrade for $9.99/mo
          </a>
          .
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(body);
        }}
        className="flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full bg-card border border-line px-4 py-2 text-sm outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
