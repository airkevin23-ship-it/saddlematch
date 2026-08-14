"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, CITIES, PROMPT_BANK, isAiPromoActive, AI_FREE_PROMO_LABEL } from "@/lib/constants";
import NeighbourhoodSelect from "@/components/neighbourhood-select";
import { HorseshoeIcon, LassoHeartIcon } from "@/components/western-icons";
import type { Gender, Prompt, RelationshipIntent } from "@/types/db";

// Separate Month / Day / Year selects instead of the native <input type="date">.
// The native picker still opens on today's date on Android regardless of
// min/max (that only clamps which dates are *selectable*, not where the
// calendar view starts), so picking a birth year meant paging back one
// month at a time -- 600+ taps to reach 1972. Native <select> elements open
// as a fast scrollable list with type-ahead (tapping "1972" jumps straight
// there), so this is a real fix rather than a tweak to the broken widget.
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 83 }, (_, i) => String(CURRENT_YEAR - 18 - i));
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
function daysInMonth(year: string, month: string): number {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

// A small brand-soft circle behind a western line-art icon, sitting above a
// step's headline. Matches the treatment already used on the landing page,
// the pre-launch holding room, and Likes You -- onboarding is the one place
// in the app that was still using a plain bold sans headline instead of the
// app's actual display type and icon set.
function StepIcon({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
      <Icon className="h-8 w-8" />
    </div>
  );
}

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
  // Year / month / day are tracked as three independent pieces of state
  // rather than derived from a single composed date string. They used to
  // be parsed back out of one `birthdate` string on every render, but that
  // string was only ever set once all three were chosen -- so picking just
  // the month (with day/year still blank) produced "", which on re-render
  // parsed back out to an empty month too, snapping the select right back
  // to its placeholder. Each pick looked like it did nothing because it
  // genuinely didn't persist. Independent state means picking one part
  // sticks regardless of what else is still unset.
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const birthdate = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : "";
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

  function updateBirthdatePart(part: "year" | "month" | "day", value: string) {
    const nextYear = part === "year" ? value : birthYear;
    const nextMonth = part === "month" ? value : birthMonth;
    let nextDay = part === "day" ? value : birthDay;
    // Clamp the day if switching to a shorter month (e.g. Jan 31 -> Feb) so
    // the composed date never comes out invalid.
    const maxDay = daysInMonth(nextYear, nextMonth);
    if (nextDay && Number(nextDay) > maxDay) {
      nextDay = String(maxDay).padStart(2, "0");
    }
    setBirthYear(nextYear);
    setBirthMonth(nextMonth);
    setBirthDay(nextDay);
  }

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
            <h1 className="font-display text-2xl font-bold leading-snug mb-2">Add your best photo</h1>
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
            <h1 className="font-display text-2xl font-bold leading-snug mb-1">About you</h1>
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
                <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
                  <select
                    aria-label="Birth month"
                    value={birthMonth}
                    onChange={(e) => updateBirthdatePart("month", e.target.value)}
                    className="w-full rounded-xl bg-card border border-line px-2 py-3 text-sm outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Birth day"
                    value={birthDay}
                    onChange={(e) => updateBirthdatePart("day", e.target.value)}
                    className="w-full rounded-xl bg-card border border-line px-2 py-3 text-sm outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: daysInMonth(birthYear, birthMonth) }, (_, i) => {
                      const d = String(i + 1).padStart(2, "0");
                      return (
                        <option key={d} value={d}>
                          {i + 1}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    aria-label="Birth year"
                    value={birthYear}
                    onChange={(e) => updateBirthdatePart("year", e.target.value)}
                    className="w-full rounded-xl bg-card border border-line px-2 py-3 text-sm outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Year</option>
                    {BIRTH_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
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
            <StepIcon icon={HorseshoeIcon} />
            <h1 className="font-display text-2xl font-bold leading-snug mb-2">Where are you based?</h1>
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
            <StepIcon icon={LassoHeartIcon} />
            <h1 className="font-display text-2xl font-bold leading-snug mb-2">What are you into?</h1>
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
            <h1 className="font-display text-2xl font-bold leading-snug mb-1">Your 3 prompts</h1>
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
                  {aiLoadingIndex === i ? "Writing…" : `✨ Help me answer (AI, ${isAiPromoActive() ? AI_FREE_PROMO_LABEL : "Plus"})`}
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
