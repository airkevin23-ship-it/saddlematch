"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, CITIES, PROMPT_BANK } from "@/lib/constants";
import NeighbourhoodSelect from "@/components/neighbourhood-select";
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

const STEP_COUNT = 5;
const STEP_LABELS = ["Photo", "About you", "Area", "Interests", "Prompts"];

// One thing at a time, Hinge-style, instead of one long form. Legal and
// matching essentials (birthdate, gender, who you're interested in) get
// folded into the "About you" step since they can't be skipped — but ZIP
// code, the dating-preference age range, relationship intent, tagline, and
// the politics/drinking/etc. detail fields are all editable later on the
// profile and preferences pages, so none of that has to slow down day one.
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [interestedIn, setInterestedIn] = useState<Gender[]>(["female"]);

  const [cityId, setCityId] = useState(CITIES[0].id);

  const [interests, setInterests] = useState("");

  const [prompts, setPrompts] = useState<Prompt[]>(EMPTY_PROMPTS);
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, [supabase]);

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

  async function handlePhotoUpload(file: File) {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Photos must be smaller than 10 MB.");
      return;
    }
    setPhotoUploading(true);
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/photo-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setError("We couldn't upload that photo. Please try again.");
      setPhotoUploading(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("profile-media").getPublicUrl(path);
    setPhotoUrl(publicUrl.publicUrl);
    setPhotoUploading(false);
  }

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
          notes: "",
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

  function validateStep(): string | null {
    if (step === 1) {
      if (!displayName.trim()) return "Add your first name.";
      if (!birthdate) return "Add your birthdate.";
      const age = Math.floor(
        (Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) return `You need to be 18 or older to use ${APP_NAME}.`;
      if (interestedIn.length === 0) return "Choose who you're interested in.";
    }
    if (step === 4) {
      if (prompts.some((p) => !p.answer.trim())) {
        return "Answer all 3 prompts — they're what people see first.";
      }
    }
    return null;
  }

  async function handleContinue() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
      return;
    }
    await handleFinish();
  }

  function handleBack() {
    setError(null);
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);

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
      photo_urls: photoUrl ? [photoUrl] : [],
      bio: "",
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      prompts,
    };

    let { error } = await supabase.from("profiles").upsert({
      ...baseProfile,
      min_age: 18,
      max_age: 99,
      relationship_intent: "open_to_either" as RelationshipIntent,
    });

    // A newly added database field can take a short time to reach every API
    // cache. Keep onboarding usable during that brief window; defaults are
    // applied later.
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
    <main className="min-h-screen flex flex-col bg-cream text-ink px-6 py-8">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-sm text-ink-faint hover:text-ink-soft font-medium min-h-11 -ml-1 px-1"
        >
          ← Back
        </button>
        <p className="text-xs text-ink-faint font-medium">{STEP_LABELS[step]}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
        {step === 0 && (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Add your best photo</h1>
            <p className="text-ink-soft leading-relaxed mb-6">
              Profiles with a real photo get a lot more matches. You can add
              more later.
            </p>
            <div className="mx-auto w-48 aspect-[4/5] rounded-3xl bg-card border border-line overflow-hidden flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-ink-faint text-sm px-4">No photo yet</span>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-card px-3 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand">
                Choose photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={photoUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-brand px-3 text-sm font-bold text-white hover:bg-brand-dark">
                Take a photo
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  disabled={photoUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {photoUploading && <p className="mt-3 text-xs font-medium text-brand">Uploading…</p>}
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">About you</h1>
            <p className="text-ink-soft mb-6 text-sm">Just the basics — you can add more later.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-ink-soft block mb-1 font-medium">First name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-ink-soft block mb-1 font-medium">Birthdate</label>
                <input
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Where are you based?</h1>
            <p className="text-ink-soft leading-relaxed mb-6">
              SaddleMatch is Austin-only for now. Pick the area you call home &mdash;
              it sets who shows up in your daily matches.
            </p>
            <div className="text-left">
              <NeighbourhoodSelect
                value={cityId}
                onChange={setCityId}
                label="Your neighbourhood"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">What are you into?</h1>
            <p className="text-ink-soft leading-relaxed mb-6">
              A few things you love — separated by commas.
            </p>
            <input
              placeholder="live music, tacos, hiking"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors text-center"
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Your 3 prompts</h1>
            <p className="text-ink-soft mb-6 text-sm">
              These are what people see and like on your profile — pick prompts
              you can answer specifically.
            </p>
            {prompts.map((p, i) => (
              <div key={i} className="mb-5">
                <select
                  value={p.question}
                  onChange={(e) => updatePromptQuestion(i, e.target.value)}
                  className="w-full rounded-xl bg-card border border-line px-3 py-2 text-sm outline-none focus:border-brand transition-colors mb-1"
                >
                  {PROMPT_BANK.map((q) => (
                    <option key={q} value={q} disabled={usedQuestions.has(q) && q !== p.question}>
                      {usedQuestions.has(q) && q !== p.question ? q + " (already used)" : q}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
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
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-4 text-center">{error}</p>}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-6 bg-brand" : "w-1.5 bg-line-strong"
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading || photoUploading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3.5 rounded-full font-bold transition-colors min-h-12"
      >
        {loading ? "Saving…" : step === STEP_COUNT - 1 ? "Finish" : "Continue"}
      </button>
    </main>
  );
}
