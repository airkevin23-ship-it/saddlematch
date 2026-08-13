"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicProfile } from "@/types/db";
import { CITIES, SHOW_SAMPLE_PROFILES } from "@/lib/constants";
import { CowboyHatIcon } from "@/components/western-icons";
import { ageOf, heightOf, orderedDetails } from "@/lib/profile-details";

// Three sample profiles shown when the real queue is empty. They exist so
// the app can be demonstrated before Austin has members. Every one is
// flagged is_demo, which renders the "Sample profile" badge on the photo,
// so nobody is misled into thinking they are real people.
//
// These must be removed before any App Store submission — placeholder
// profiles in a review build are grounds for rejection under Guideline 4.2.
const SAMPLE_PROFILES: PublicProfile[] = [
  {
    id: "sample-maddie",
    display_name: "Maddie",
    age: 27,
    gender: "female",
    city_id: 2,
    bio: "Live music, weekend trail rides, and finding the best breakfast tacos in town.",
    interests: ["Horses", "Live music", "Weekend trips"],
    photo_urls: ["/maddie-profile.png"],
    prompts: [{ question: "Best local spot for a first date…", answer: "Somewhere with good queso and a little live music." }],
    is_active: true,
    is_demo: true,
    created_at: "2026-01-01T00:00:00.000Z",
    relationship_intent: "open_to_either",
  },
  {
    id: "sample-jordan",
    display_name: "Jordan",
    age: 29,
    gender: "male",
    city_id: 2,
    bio: "East Austin regular, always up for a rodeo, a road trip, or cooking for friends.",
    interests: ["Rodeos", "Cooking", "Dogs"],
    photo_urls: ["/jordan-profile.png"],
    prompts: [{ question: "My simple pleasures are…", answer: "A great cup of coffee, a good dog, and a wide-open Saturday." }],
    is_active: true,
    is_demo: true,
    created_at: "2026-01-01T00:00:00.000Z",
    relationship_intent: "open_to_either",
  },
  {
    id: "sample-casey",
    display_name: "Casey",
    age: 26,
    gender: "female",
    city_id: 2,
    bio: "Country concerts, family dinners, and making room for the people who matter.",
    interests: ["Country music", "Family", "Outdoors"],
    photo_urls: ["/casey-profile.png"],
    prompts: [{ question: "The way to win me over is…", answer: "Be kind, be consistent, and make me laugh." }],
    is_active: true,
    is_demo: true,
    created_at: "2026-01-01T00:00:00.000Z",
    relationship_intent: "open_to_either",
  },
];


const RELATIONSHIP_INTENT_LABELS: Record<string, string> = {
  long_term: "A long-term relationship",
  life_partner: "A life partner",
  marriage: "Marriage",
  short_term: "Something short-term",
  casual: "Casual dating",
  friendship: "Friendship first",
  figuring_it_out: "Figuring it out",
  open_to_either: "Open to exploring",
};

export default function DiscoverPage() {
  const supabase = createClient();
  const [candidates, setCandidates] = useState<PublicProfile[]>([]);
  const [showingSamples, setShowingSamples] = useState(false);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchToast, setMatchToast] = useState<string | null>(null);

  const [openPromptIndex, setOpenPromptIndex] = useState<number | "photo" | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const [previewReason, setPreviewReason] = useState<string | null>(null);
  const [previewShared, setPreviewShared] = useState<string[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [wildflowerLoading, setWildflowerLoading] = useState(false);
  const [wildflowerTarget, setWildflowerTarget] = useState<PublicProfile | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterMinAge, setFilterMinAge] = useState(18);
  const [filterMaxAge, setFilterMaxAge] = useState(99);
  const [filterGenders, setFilterGenders] = useState<string[]>([]);
  const [filteredEmpty, setFilteredEmpty] = useState(false);

  async function loadQueue(useFilters = false) {
    setLoading(true);
    setError(null);
    // A safety notice raised on one card must not survive into the next queue.
    setSafetyMessage(null);
    setOpenPromptIndex(null);
    setComment("");
    setPreviewReason(null);
    setPreviewShared(null);

    try {
      const params = new URLSearchParams();
      if (useFilters) {
        params.set("minAge", String(filterMinAge));
        params.set("maxAge", String(filterMaxAge));
        if (filterGenders.length) params.set("genders", filterGenders.join(","));
      }
      const res = await fetch(`/api/daily-queue${params.size ? `?${params}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load today's picks.");
      const nextCandidates = data.candidates ?? [];
      if (useFilters && nextCandidates.length === 0) {
        setCandidates([]);
        setShowingSamples(nextCandidates.length === 0);
        setFilteredEmpty(true);
        setIndex(0);
        return;
      }
      setFilteredEmpty(false);
      // Sample profiles only appear when SHOW_SAMPLE_PROFILES is on (see
      // src/lib/constants.ts) so the queue never looks like a ghost town
      // while the real Austin pool is thin. Flip that flag to false
      // before any App Store submission — placeholder profiles in a
      // review build are grounds for rejection under Guideline 4.2.
      const useSamples = nextCandidates.length === 0 && SHOW_SAMPLE_PROFILES;
      setCandidates(useSamples ? SAMPLE_PROFILES : nextCandidates);
      setShowingSamples(useSamples);
      setIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load today's picks.");
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
    setPreviewShared(null);
    setPreviewError(null);
  }

  function toggleFilterGender(gender: string) {
    setFilterGenders((current) => current.includes(gender) ? current.filter((item) => item !== gender) : [...current, gender]);
  }

  async function handleSwipe(action: "like" | "pass", likeCommentArg?: string, promptIndex?: number) {
    const current = candidates[index];
    if (!current) return;

    if (current.is_demo) {
      setSafetyMessage(action === "like" ? "Sample profile liked. Real matches will appear here as members join." : "Sample profile passed.");
      resetCardState();
      setIndex((i) => i + 1);
      return;
    }

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
          const { data: sentMessage } = await supabase
            .from("messages")
            .insert({
              match_id: match.id,
              sender_id: user.id,
              body: likeCommentArg,
            })
            .select("id")
            .single();
          if (sentMessage) {
            fetch("/api/notify/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId: sentMessage.id }),
            }).catch(() => {});
          }
        }
        // Best-effort — a failed notification should never block the swipe.
        fetch("/api/notify/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id }),
        }).catch(() => {});
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
    if (current.is_demo) {
      setSafetyMessage("AI compatibility notes are available on real member profiles.");
      return;
    }
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
      if (data.shared?.length > 0) {
        setPreviewShared(data.shared);
      } else {
        setPreviewReason(data.reason);
      }
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
    if (candidates[index]?.is_demo) {
      setSafetyMessage("Sample profiles are fictional and cannot be blocked.");
      return;
    }
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
    if (candidates[index]?.is_demo) {
      setSafetyMessage("Sample profiles are fictional and do not need to be reported.");
      return;
    }
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

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 bg-cream min-h-screen text-ink">
      {matchToast && (
        <div className="mb-4 rounded-xl bg-brand-soft border border-brand/30 text-brand-dark text-sm font-semibold px-4 py-3 text-center">
          {matchToast}
        </div>
      )}

      {wildflowerTarget && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="wildflower-title">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-3xl text-brand" aria-hidden="true">✿</div>
            <h2 id="wildflower-title" className="mt-4 text-center text-xl font-extrabold">Send a Wildflower?</h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
              {`Let ${wildflowerTarget.display_name} know you’re especially interested. A Wildflower is a one-time extra-interest signal.`}
            </p>
            <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">One-time purchase</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">$5.00</p>
              <p className="mt-1 text-xs text-ink-soft">You&apos;ll review payment securely before the purchase is complete.</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setWildflowerTarget(null)} disabled={wildflowerLoading} className="min-h-12 flex-1 rounded-xl border border-line px-4 text-sm font-bold text-ink-soft disabled:opacity-50">Not now</button>
              <button type="button" onClick={() => sendWildflower(wildflowerTarget.id)} disabled={wildflowerLoading} className="min-h-12 flex-1 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">{wildflowerLoading ? "Opening checkout…" : "Continue to payment"}</button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && candidates.length > 0 && (
        <div className="mb-5 flex items-center justify-between px-1">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-brand">Today&rsquo;s picks</p>
          <button onClick={() => setFiltersOpen((open) => !open)} className="min-h-10 rounded-lg px-2 text-xs font-bold text-ink-soft hover:bg-card hover:text-ink">Filters</button>
        </div>
      )}

      {showingSamples && current && (
        <div className="mb-5 rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3 text-center text-sm text-brand-dark">
          <strong>Explore how SaddleMatch works.</strong> These fictional sample profiles
          cannot receive likes, Wildflowers, reports, or create matches. Real Austin
          members will appear here as the community grows.
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

      {!loading && !error && !current && filteredEmpty && (
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-bold">No one matches those filters</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Nobody in today&rsquo;s picks fits what you set. Austin is still a
            small community here, so widening usually helps.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setFilterMinAge(18);
                setFilterMaxAge(99);
                setFilterGenders([]);
                setFiltersOpen(false);
                loadQueue();
              }}
              className="min-h-11 rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Clear filters
            </button>
            <button
              onClick={() => setFiltersOpen(true)}
              className="min-h-11 px-4 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              Adjust filters
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !current && !filteredEmpty && (
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-bold mb-1">
            {showingSamples ? "You’ve explored every sample" : "You’re all caught up"}
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            {showingSamples
              ? "Real Austin members will appear in your daily picks as the community grows. Sample activity never creates a match."
              : "That’s all of today’s curated picks. Check back tomorrow—quality over an endless deck."}
          </p>
          <button
            onClick={() => loadQueue()}
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
                  Sample profile
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
                className={`absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-xl text-white shadow-lg ring-4 ring-card transition-colors hover:bg-brand ${
                  photoIndex === (current.photo_urls?.length || 1) - 1 ? "-bottom-6" : "bottom-3"
                }`}
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
                {current.display_name}
                {ageOf(current.visible_details) ?? current.age
                  ? `, ${ageOf(current.visible_details) ?? current.age}`
                  : ""}
              </h2>
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <button
                  onClick={() => handleReport(current.id)}
                  disabled={safetyBusy}
                  className={`text-[11px] text-ink-faint hover:text-ink-soft font-medium disabled:opacity-50 ${current.is_demo ? "hidden" : ""}`}
                >
                  Report
                </button>
                <button
                  onClick={() => handleBlock(current.id)}
                  disabled={safetyBusy}
                  className={`text-[11px] text-ink-faint hover:text-red-600 font-medium disabled:opacity-50 ${current.is_demo ? "hidden" : ""}`}
                >
                  Block
                </button>
              </div>
            </div>
              {/* Height sits with name and age because it is one of the first
                  things people look for. It cannot be hidden. */}
              {heightOf(current.visible_details) && (
                <p className="mt-0.5 text-sm font-semibold text-ink-soft">
                  {heightOf(current.visible_details)}
                </p>
              )}
            {current.bio && (
              <p className="text-ink-soft mt-1 text-base leading-relaxed">{current.bio}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Based in</span><span className="font-semibold">{CITIES.find((city) => city.id === current.city_id)?.name ?? "Austin"}</span></div>
              <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Looking for</span><span className="font-semibold">{RELATIONSHIP_INTENT_LABELS[current.relationship_intent] ?? "Open to exploring"}</span></div>
            </div>
              {orderedDetails(current.visible_details).length > 0 && (
                <div className="mt-4 rounded-2xl border border-line bg-cream/60 px-4">
                  {orderedDetails(current.visible_details).map((row) => (
                    <div
                      key={row.key}
                      className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-0"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                        {row.label}
                      </span>
                      <span className="text-sm font-semibold text-ink">{row.value}</span>
                    </div>
                  ))}
                </div>
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

            <button
              onClick={() => current.is_demo ? setSafetyMessage("Wildflowers can only be sent to real members.") : setWildflowerTarget(current)}
              disabled={wildflowerLoading || current.is_demo}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-brand/30 bg-brand-soft px-4 text-sm font-bold text-brand-dark hover:bg-brand hover:text-white disabled:opacity-50 transition-colors"
            >
              {current.is_demo ? "Wildflowers available on real profiles" : wildflowerLoading ? "Opening checkout…" : "✿ Send a Wildflower"}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-ink-faint">A one-time extra-interest signal. It does not guarantee a match.</p>

            {/* AI compatibility preview — Coffee Meets Bagel style, shown before deciding */}
            <div className="mt-4">
              {previewShared && previewShared.length > 0 ? (
                <div className="rounded-xl bg-brand-soft border border-brand/20 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">You both</p>
                  <ul className="mt-1 space-y-0.5">
                    {previewShared.map((trait, i) => (
                      <li key={i} className="text-sm text-brand-dark">✓ {trait}</li>
                    ))}
                  </ul>
                </div>
              ) : previewReason ? (
                <p className="text-sm text-brand-dark bg-brand-soft border border-brand/20 rounded-xl px-3 py-2">
                  ✨ {previewReason}
                </p>
              ) : (
                <button
                  onClick={handlePreviewReason}
                  disabled={previewLoading || current.is_demo}
                  className="text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
                >
                  {current.is_demo ? "AI insights available on real profiles" : previewLoading ? "Thinking…" : "✨ See what you might have in common (AI, Plus)"}
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

          {/* Sits at the end of the card rather than floating over it. It was
              sticky bottom-20, but the card wrapping it has overflow-hidden, and an
              overflow-hidden ancestor breaks position: sticky — so the bar hovered
              over the last prompt instead of clearing it, and the prompt answer was
              unreadable. Anchored in flow it can never cover content. */}
          <div className="flex border-t border-line bg-card">
            {current.is_demo ? (
              <button
                onClick={() => handleSwipe("pass")}
                disabled={sending}
                className="min-h-14 flex-1 font-bold text-brand transition-colors hover:bg-brand-soft disabled:opacity-50"
              >
                View next sample
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
