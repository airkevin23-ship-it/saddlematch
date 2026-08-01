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

  const [openPromptIndex, setOpenPromptIndex] = useState<number | "photo" | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const [previewReason, setPreviewReason] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [wildflowerLoading, setWildflowerLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterMinAge, setFilterMinAge] = useState(18);
  const [filterMaxAge, setFilterMaxAge] = useState(99);
  const [filterGenders, setFilterGenders] = useState<string[]>([]);

  async function loadQueue(useFilters = false) {
    setLoading(true);
    setError(null);
    setOpenPromptIndex(null);
    setComment("");
    setPreviewReason(null);

    try {
      const params = new URLSearchParams();
      if (useFilters) {
        params.set("minAge", String(filterMinAge));
        params.set("maxAge", String(filterMaxAge));
        if (filterGenders.length) params.set("genders", filterGenders.join(","));
      }
      const res = await fetch(`/api/daily-queue${params.size ? `?${params}` : ""}`);
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

  function toggleFilterGender(gender: string) {
    setFilterGenders((current) => current.includes(gender) ? current.filter((item) => item !== gender) : [...current, gender]);
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

  async function sendWildflower(targetId: string) {
    setWildflowerLoading(true);
    try {
      const response = await fetch("/api/stripe/wildflower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't start checkout.");
      window.location.assign(data.url);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setWildflowerLoading(false);
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 bg-cream min-h-screen text-ink">
      {matchToast && (
        <div className="mb-4 rounded-xl bg-brand-soft border border-brand/30 text-brand-dark text-sm font-semibold px-4 py-3 text-center">
          {matchToast}
        </div>
      )}

      {!loading && !error && candidates.length > 0 && (
        <div className="mb-5 flex items-center justify-between px-1">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-brand">Today&rsquo;s roundup</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setFiltersOpen((open) => !open)} className="min-h-10 rounded-lg px-2 text-xs font-bold text-ink-soft hover:bg-card hover:text-ink">Filters</button>
            <p className="text-xs text-ink-soft font-medium">{remaining} left</p>
          </div>
        </div>
      )}

      {filtersOpen && (
        <section className="mb-5 rounded-2xl border border-line bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-bold">Filters</h2><button onClick={() => setFiltersOpen(false)} className="min-h-10 px-2 text-sm font-semibold text-ink-soft">Done</button></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-ink-soft">Minimum age<input type="number" min="18" max="99" value={filterMinAge} onChange={(e) => setFilterMinAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base text-ink outline-none focus:border-brand" /></label>
            <label className="text-xs font-semibold text-ink-soft">Maximum age<input type="number" min="18" max="99" value={filterMaxAge} onChange={(e) => setFilterMaxAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base text-ink outline-none focus:border-brand" /></label>
          </div>
          <p className="mt-4 text-xs font-semibold text-ink-soft">Show me</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["male", "female", "nonbinary", "other"].map((gender) => <button type="button" key={gender} onClick={() => toggleFilterGender(gender)} className={`min-h-10 rounded-full border px-3 text-sm font-semibold capitalize ${filterGenders.includes(gender) ? "border-brand bg-brand text-white" : "border-line text-ink-soft"}`}>{gender === "male" ? "Men" : gender === "female" ? "Women" : gender}</button>)}
          </div>
          <button onClick={() => { setFiltersOpen(false); loadQueue(true); }} className="mt-4 min-h-12 w-full rounded-xl bg-brand font-bold text-white">Apply filters</button>
        </section>
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
          {(current.photo_urls?.length ? current.photo_urls : [null]).map((photoUrl, photoIndex) => (
            <div key={photoUrl ?? "empty-photo"} className="aspect-[4/5] bg-line flex items-center justify-center text-ink-faint relative border-b border-line last:border-b-0">
              {current.is_demo && photoIndex === 0 && (
                <span className="absolute top-3 left-3 bg-ink text-cream text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
                  Demo profile
                </span>
              )}
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={`${current.display_name} photo ${photoIndex + 1}`} className="w-full h-full object-cover" />
              ) : (
                <CowboyHatIcon className="w-14 h-14" />
              )}
              <button
                onClick={() => setOpenPromptIndex(openPromptIndex === "photo" ? null : "photo")}
                className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-xl text-white shadow-lg hover:bg-brand transition-colors"
                aria-label={`Like photo ${photoIndex + 1}`}
              >
                {openPromptIndex === "photo" ? "♥" : "♡"}
              </button>
            </div>
          ))}

          {openPromptIndex === "photo" && (
            <div className="border-b border-line bg-brand-soft p-4">
              <p className="text-xs font-bold text-brand-dark">Like their photo with a note</p>
              <textarea
                autoFocus
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What caught your eye?"
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-brand/20 bg-card px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => setOpenPromptIndex(null)} className="min-h-11 flex-1 rounded-xl border border-line bg-card text-sm font-semibold text-ink-soft">Cancel</button>
                <button onClick={() => handleSwipe("like", comment.trim() || undefined)} disabled={sending} className="min-h-11 flex-1 rounded-xl bg-brand text-sm font-bold text-white disabled:opacity-50">{sending ? "Sending…" : "Send like"}</button>
              </div>
            </div>
          )}

          {current.intro_video_url && (
            <div className="border-b border-line bg-ink p-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cream/70">Intro video</p>
              <video src={current.intro_video_url} controls playsInline preload="metadata" className="w-full rounded-xl" />
            </div>
          )}

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">
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
              <p className="text-ink-soft mt-1 text-base leading-relaxed">{current.bio}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Based in</span><span className="font-semibold">Texas</span></div>
              <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Looking for</span><span className="font-semibold">Real connection</span></div>
            </div>
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

            <button
              onClick={() => sendWildflower(current.id)}
              disabled={wildflowerLoading}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-brand/30 bg-brand-soft px-4 text-sm font-bold text-brand-dark hover:bg-brand hover:text-white disabled:opacity-50 transition-colors"
            >
              {wildflowerLoading ? "Opening checkout…" : "✿ Send a Wildflower · $5"}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-ink-faint">A one-time extra-interest signal. It does not guarantee a match.</p>

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
                    className="rounded-2xl border border-line bg-cream p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-ink-soft font-bold uppercase tracking-wide">{p.question}</p>
                        <p className="text-base mt-2 leading-relaxed font-medium">{p.answer}</p>
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

          <div className="sticky bottom-20 sm:bottom-0 flex border-t border-line bg-card">
            <button
              onClick={() => handleSwipe("pass")}
              disabled={sending}
              className="flex-1 min-h-14 text-ink-soft hover:bg-line/40 font-semibold disabled:opacity-50 transition-colors"
            >
              Pass
            </button>
            <button
              onClick={() => handleSwipe("like")}
              disabled={sending}
              className="flex-1 min-h-14 text-brand hover:bg-brand-soft font-bold border-l border-line disabled:opacity-50 transition-colors"
            >
              Like profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
