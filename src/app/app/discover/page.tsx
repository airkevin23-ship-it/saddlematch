"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/types/db";
import { CowboyHatIcon } from "@/components/western-icons";

export default function DiscoverPage() {
  const supabase = createClient();
  const [candidates, setCandidates] = useState<PublicProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchToast, setMatchToast] = useState<string | null>(null);

  const [openPromptIndex, setOpenPromptIndex] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const [previewReason, setPreviewReason] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    setOpenPromptIndex(null);
    setComment("");
    setPreviewReason(null);

    try {
      const res = await fetch("/api/daily-queue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load today's roundup.");
      setCandidates(data.candidates ?? []);
      setIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load today's roundup.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue();
  }, []);

  function resetCardState() {
    setOpenPromptIndex(null);
    setComment("");
    setPreviewReason(null);
    setPreviewError(null);
  }

  async function handleSwipe(action: "like" | "pass", likeCommentArg?: string, promptIndex?: number) {
    const current = candidates[index];
    if (!current) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSending(true);

    await supabase.from("swipes").insert({
      swiper_id: user.id,
      target_id: current.id,
      action,
      like_comment: likeCommentArg ?? null,
      liked_prompt_index: promptIndex ?? null,
    });

    if (action === "like") {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`user_a.eq.${current.id},user_b.eq.${current.id}`)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle();

      if (match) {
        if (likeCommentArg) {
          await supabase.from("messages").insert({
            match_id: match.id,
            sender_id: user.id,
            body: likeCommentArg,
          });
        }
        setMatchToast(`You matched with ${current.display_name}! 🎉`);
        setTimeout(() => setMatchToast(null), 4000);
      }
    }

    setSending(false);
    resetCardState();
    setIndex((i) => i + 1);
  }

  async function handlePreviewReason() {
    const current = candidates[index];
    if (!current) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/ai/preview-reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: current.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't generate that right now.");
      setPreviewReason(data.reason);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Couldn't generate that right now.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleBlock(targetId: string) {
    if (!confirm("Block this person? You won't see each other again.")) return;
    setSafetyBusy(true);
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    setSafetyBusy(false);
    setSafetyMessage("Blocked.");
    resetCardState();
    setIndex((i) => i + 1);
  }

  async function handleReport(targetId: string) {
    const reason = prompt(
      "What's going on? (e.g. fake profile, harassment, inappropriate photo)"
    );
    if (!reason) return;
    setSafetyBusy(true);
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, reason }),
    });
    setSafetyBusy(false);
    setSafetyMessage("Reported. Our team will review it.");
  }

  const current = candidates[index];
  const remaining = candidates.length - index;

  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-cream min-h-screen text-ink">
      {matchToast && (
        <div className="mb-4 rounded-xl bg-brand-soft border border-brand/30 text-brand-dark text-sm font-semibold px-4 py-3 text-center">
          {matchToast}
        </div>
      )}

      {!loading && !error && candidates.length > 0 && (
        <p className="text-xs text-ink-soft text-center mb-4 font-medium tracking-wide uppercase">
          {remaining} of {candidates.length} in today&rsquo;s roundup
        </p>
      )}

      {loading && <p className="text-ink-soft text-center">Rounding up today&rsquo;s picks…</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      {!loading && !error && !current && (
        <div className="text-center py-20">
          <p className="text-lg font-bold mb-1">You&rsquo;re all caught up</p>
          <p className="text-ink-soft text-sm">
            That&rsquo;s today&rsquo;s roundup. New curated matches tomorrow — quality
            over an endless deck.
          </p>
          <button
            onClick={loadQueue}
            className="mt-4 text-brand hover:text-brand-dark font-semibold text-sm"
          >
            Refresh
          </button>
        </div>
      )}

      {safetyMessage && (
        <p className="text-xs text-ink-soft text-center mb-3">{safetyMessage}</p>
      )}

      {current && (
        <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06] overflow-hidden">
          <div className="aspect-[4/5] bg-line flex items-center justify-center text-ink-faint relative">
            {current.is_demo && (
              <span className="absolute top-2 left-2 bg-ink text-cream text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
                Demo profile
              </span>
            )}
            {current.photo_urls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.photo_urls[0]}
                alt={current.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <CowboyHatIcon className="w-14 h-14" />
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">
                {current.display_name}, {current.age}
              </h2>
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <button
                  onClick={() => handleReport(current.id)}
                  disabled={safetyBusy}
                  className="text-[11px] text-ink-faint hover:text-ink-soft font-medium disabled:opacity-50"
                >
                  Report
                </button>
                <button
                  onClick={() => handleBlock(current.id)}
                  disabled={safetyBusy}
                  className="text-[11px] text-ink-faint hover:text-red-600 font-medium disabled:opacity-50"
                >
                  Block
                </button>
              </div>
            </div>
            {current.bio && (
              <p className="text-ink-soft mt-1 text-sm">{current.bio}</p>
            )}
            {current.interests?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {current.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs bg-line px-2.5 py-1 rounded-full text-ink-soft font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* AI compatibility preview — Coffee Meets Bagel style, shown before deciding */}
            <div className="mt-4">
              {previewReason ? (
                <p className="text-sm text-brand-dark bg-brand-soft border border-brand/20 rounded-xl px-3 py-2">
                  ✨ {previewReason}
                </p>
              ) : (
                <button
                  onClick={handlePreviewReason}
                  disabled={previewLoading}
                  className="text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
                >
                  {previewLoading ? "Thinking…" : "✨ See what you might have in common (AI, Plus)"}
                </button>
              )}
              {previewError && <p className="text-xs text-red-600 mt-1">{previewError}</p>}
            </div>

            {/* Prompts — Hinge style: like a specific answer with a comment */}
            {current.prompts?.length > 0 && (
              <div className="mt-5 space-y-3">
                {current.prompts.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-line bg-cream p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-ink-soft font-medium">{p.question}</p>
                        <p className="text-sm mt-1">{p.answer}</p>
                      </div>
                      <button
                        onClick={() =>
                          setOpenPromptIndex(openPromptIndex === i ? null : i)
                        }
                        className="shrink-0 text-brand hover:text-brand-dark text-lg transition-colors"
                        aria-label="Like this prompt"
                      >
                        {openPromptIndex === i ? "♥" : "♡"}
                      </button>
                    </div>

                    {openPromptIndex === i && (
                      <div className="mt-3">
                        <input
                          autoFocus
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment about this…"
                          className="w-full rounded-lg bg-card border border-line px-3 py-2 text-sm outline-none focus:border-brand transition-colors"
                        />
                        <button
                          onClick={() => handleSwipe("like", comment.trim() || undefined, i)}
                          disabled={sending || !comment.trim()}
                          className="mt-2 w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm py-2 rounded-lg font-bold transition-colors"
                        >
                          {sending ? "Sending…" : "Send like"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex border-t border-line">
            <button
              onClick={() => handleSwipe("pass")}
              disabled={sending}
              className="flex-1 py-4 text-ink-soft hover:bg-line/40 font-semibold disabled:opacity-50 transition-colors"
            >
              Pass
            </button>
            <button
              onClick={() => handleSwipe("like")}
              disabled={sending}
              className="flex-1 py-4 text-brand hover:bg-brand-soft font-bold border-l border-line disabled:opacity-50 transition-colors"
            >
              Like profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
