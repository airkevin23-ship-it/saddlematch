"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, CITIES, PROMPT_BANK } from "@/lib/constants";
import type { Gender, Prompt, RelationshipIntent } from "@/types/db";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Man" },
  { value: "female", label: "Woman" },
  { value: "nonbinary", label: "Nonbinary" },
  { value: "other", label: "Other" },
];

const EMPTY_PROMPTS: Prompt[] = [
  { question: PROMPT_BANK[0], answer: "" },
  { question: PROMPT_BANK[1], answer: "" },
  { question: PROMPT_BANK[2], answer: "" },
];

const DATING_INTENTIONS: { value: RelationshipIntent; label: string }[] = [
  { value: "long_term", label: "A long-term relationship" },
  { value: "life_partner", label: "A life partner" },
  { value: "marriage", label: "Marriage" },
  { value: "short_term", label: "Something short-term" },
  { value: "casual", label: "Casual dating" },
  { value: "friendship", label: "Friendship first" },
  { value: "figuring_it_out", label: "Figuring it out" },
  { value: "open_to_either", label: "Open to exploring" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [interestedIn, setInterestedIn] = useState<Gender[]>(["female"]);
  const [minAge, setMinAge] = useState(24);
  const [maxAge, setMaxAge] = useState(45);
  const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent>("long_term");
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [zipCode, setZipCode] = useState("");
  const [tagline, setTagline] = useState("");
  const [interests, setInterests] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>(EMPTY_PROMPTS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);

  function toggleInterestedIn(g: Gender) {
    setInterestedIn((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function updatePromptQuestion(i: number, question: string) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, question } : p)));
  }

  function updatePromptAnswer(i: number, answer: string) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, answer } : p)));
  }

  const usedQuestions = new Set(prompts.map((p) => p.question));

  async function handleAiPrompt(i: number) {
    setAiLoadingIndex(i);
    setError(null);
    try {
      const city = CITIES.find((c) => c.id === cityId);
      const res = await fetch("/api/ai/prompt-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompts[i].question,
          city: city?.name,
          interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
          notes: tagline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI prompt writer failed");
      updatePromptAnswer(i, data.answer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't generate an answer right now."
      );
    } finally {
      setAiLoadingIndex(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (prompts.some((p) => !p.answer.trim())) {
      setError("Answer all 3 prompts — they're what people see first.");
      return;
    }

    const age = Math.floor(
      (Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (!birthdate || age < 18) {
      setError("You need to be 18 or older to use " + APP_NAME + ".");
      return;
    }
    if (minAge < 18 || maxAge < minAge) {
      setError("Choose a valid age range.");
      return;
    }
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setError("Enter a valid 5-digit ZIP code, or leave it blank.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in.");
      setLoading(false);
      return;
    }

    const baseProfile = {
      id: user.id,
      display_name: displayName,
      birthdate,
      gender,
      interested_in: interestedIn,
      city_id: cityId,
      preference_details: { location: { zipCode } },
      bio: tagline,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      prompts,
    };

    let { error } = await supabase.from("profiles").upsert({
      ...baseProfile,
      min_age: minAge,
      max_age: maxAge,
      relationship_intent: relationshipIntent,
    });

    // A newly added database field can take a short time to reach every API cache.
    // Keep onboarding usable during that brief window; defaults are applied later.
    if (error?.message.includes("schema cache")) {
      ({ error } = await supabase.from("profiles").upsert(baseProfile));
    }

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/app/discover");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-6 py-12 flex justify-center bg-cream text-ink">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Build your profile</h1>
        <p className="text-ink-soft mb-8 text-sm">
          Howdy! Takes about two minutes, and you can edit this anytime.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">First name</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">ZIP code <span className="font-normal">(optional)</span></label>
            <input value={zipCode} onChange={(event) => setZipCode(event.target.value.replace(/[^\d-]/g, "").slice(0, 10))} inputMode="numeric" autoComplete="postal-code" placeholder="For nearby matches" className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors" />
            <p className="mt-1 text-xs text-ink-soft">Private—never displayed on your profile. Used only for nearby matching.</p>
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">Birthdate</label>
            <input
              required
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">I am a</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">Interested in</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => toggleInterestedIn(g.value)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    interestedIn.includes(g.value)
                      ? "bg-brand border-brand text-white"
                      : "border-line text-ink-soft hover:border-line-strong"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">City</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(Number(e.target.value))}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-sm font-bold">Dating preferences</p>
            <p className="mt-1 text-xs text-ink-soft">These guide your daily roundup. You can change them later.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm text-ink-soft">Minimum age
                <input type="number" min="18" max="99" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" />
              </label>
              <label className="text-sm text-ink-soft">Maximum age
                <input type="number" min="18" max="99" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" />
              </label>
            </div>
            <label className="mt-3 block text-sm text-ink-soft">I&rsquo;m looking for
              <select value={relationshipIntent} onChange={(e) => setRelationshipIntent(e.target.value as RelationshipIntent)} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand">
                {DATING_INTENTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">
              Interests (comma-separated)
            </label>
            <input
              placeholder="live music, tacos, hiking"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-ink-soft block mb-1 font-medium">
              One-line tagline (optional)
            </label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Shown under your name on your card"
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-line">
            <p className="text-sm font-bold mb-1">Your 3 prompts</p>
            <p className="text-xs text-ink-soft mb-4">
              These are what people see and like on your profile — pick prompts you can
              answer specifically.
            </p>

            {prompts.map((p, i) => (
              <div key={i} className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <select
                    value={p.question}
                    onChange={(e) => updatePromptQuestion(i, e.target.value)}
                    className="flex-1 rounded-xl bg-card border border-line px-3 py-2 text-sm outline-none focus:border-brand transition-colors"
                  >
                    {PROMPT_BANK.map((q) => (
                      <option key={q} value={q} disabled={usedQuestions.has(q) && q !== p.question}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    maxLength={150}
                    value={p.answer}
                    onChange={(e) => updatePromptAnswer(i, e.target.value)}
                    placeholder="Your answer…"
                    className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAiPrompt(i)}
                    disabled={aiLoadingIndex !== null}
                    className="mt-1 text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
                  >
                    {aiLoadingIndex === i ? "Writing…" : "✨ Help me answer (AI, Plus)"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Saving…" : "Finish"}
          </button>
        </form>
      </div>
    </main>
  );
}
