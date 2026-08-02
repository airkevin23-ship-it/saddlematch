"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES, PROMPT_BANK, INTEREST_CHIPS } from "@/lib/constants";
import type { Profile, Prompt, RelationshipIntent } from "@/types/db";

const DETAIL_FIELDS = [
  ["politics", "Politics", ["Prefer not to say", "Conservative", "Moderate", "Liberal", "Not political"]],
  ["languages", "Languages spoken", ["Not answered yet", "English", "Spanish", "English and Spanish", "Other"]],
  ["relationshipType", "Relationship type", ["Not answered yet", "Monogamous", "Open to exploring", "Prefer not to say"]],
  ["drinking", "Drinking", ["Not answered yet", "No", "Sometimes", "Socially", "Regularly"]],
  ["smoking", "Smoking", ["Not answered yet", "No", "Sometimes", "Yes"]],
  ["marijuana", "Marijuana", ["Not answered yet", "No", "Sometimes", "Yes"]],
  ["drugs", "Drugs", ["Not answered yet", "No", "Prefer not to say"]],
] as const;

type DetailKey = typeof DETAIL_FIELDS[number][0];
type Details = Record<DetailKey, string>;
const EMPTY_DETAILS: Details = Object.fromEntries(DETAIL_FIELDS.map(([key, , options]) => [key, options[0]])) as Details;
const EMPTY_VISIBILITY: Record<DetailKey, boolean> = Object.fromEntries(DETAIL_FIELDS.map(([key]) => [key, true])) as Record<DetailKey, boolean>;
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

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent>("open_to_either");
  const [saving, setSaving] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"edit" | "view">("edit");
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [visibility, setVisibility] = useState<Record<DetailKey, boolean>>(EMPTY_VISIBILITY);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setMinAge(data.min_age ?? 18);
        setMaxAge(data.max_age ?? 99);
        setRelationshipIntent(data.relationship_intent ?? "open_to_either");
        const savedDetails = ((data.preference_details as unknown as { profile?: { values?: Partial<Details>; visibility?: Partial<Record<DetailKey, boolean>> } } | undefined)?.profile ?? {});
        setDetails({ ...EMPTY_DETAILS, ...(savedDetails.values ?? {}) });
        setVisibility({ ...EMPTY_VISIBILITY, ...(savedDetails.visibility ?? {}) });
        setSelectedInterests(data.interests ?? []);
        setPrompts(
          data.prompts && data.prompts.length === 3
            ? data.prompts
            : [
                { question: PROMPT_BANK[0], answer: "" },
                { question: PROMPT_BANK[1], answer: "" },
                { question: PROMPT_BANK[2], answer: "" },
              ]
        );
      }
    })();
  }, [supabase]);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function addCustomInterest(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && customInterest.trim()) {
      e.preventDefault();
      const value = customInterest.trim();
      setSelectedInterests((prev) => (prev.includes(value) ? prev : [...prev, value]));
      setCustomInterest("");
    }
  }

  function updatePromptQuestion(i: number, question: string) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, question } : p)));
  }

  function updatePromptAnswer(i: number, answer: string) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, answer } : p)));
  }

  const usedQuestions = new Set(prompts.map((p) => p.question));

  async function handleAiPrompt(i: number) {
    if (!profile) return;
    if (minAge < 18 || maxAge < minAge) {
      setError("Choose a valid age range.");
      return;
    }
    setAiLoadingIndex(i);
    setError(null);
    const city = CITIES.find((c) => c.id === profile.city_id);
    try {
      const res = await fetch("/api/ai/prompt-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompts[i].question,
          city: city?.name,
          interests: selectedInterests,
          notes: profile.bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updatePromptAnswer(i, data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI prompt writer failed.");
    } finally {
      setAiLoadingIndex(null);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        city_id: profile.city_id,
        interests: selectedInterests,
        prompts,
        min_age: minAge,
        max_age: maxAge,
        relationship_intent: relationshipIntent,
        preference_details: { ...(profile.preference_details ?? {}), profile: { values: details, visibility } } as unknown as Record<string, string>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function uploadMedia(file: File, kind: "photo" | "video") {
    if (!profile) return;
    const isPhoto = kind === "photo";
    const sizeLimit = isPhoto ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

    if (!file.type.startsWith(isPhoto ? "image/" : "video/")) {
      setError(`Please choose a ${isPhoto ? "photo" : "video"} file.`);
      return;
    }
    if (file.size > sizeLimit) {
      setError(`${isPhoto ? "Photos" : "Videos"} must be smaller than ${isPhoto ? "10" : "50"} MB.`);
      return;
    }
    if (isPhoto && profile.photo_urls.length >= 6) {
      setError("You can add up to 6 photos.");
      return;
    }

    setMediaSaving(true);
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase() || (isPhoto ? "jpg" : "mp4");
    const path = `${profile.id}/${kind}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setError("We couldn't upload that file. Please try again.");
      setMediaSaving(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("profile-media").getPublicUrl(path);
    const nextPhotos = isPhoto ? [...profile.photo_urls, publicUrl.publicUrl] : profile.photo_urls;
    const nextVideo = isPhoto ? profile.intro_video_url ?? null : publicUrl.publicUrl;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_urls: nextPhotos, intro_video_url: nextVideo, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      setError("Your upload finished, but we couldn't save it to your profile. Please try again.");
    } else {
      setProfile({ ...profile, photo_urls: nextPhotos, intro_video_url: nextVideo });
    }
    setMediaSaving(false);
  }

  async function removePhoto(url: string) {
    if (!profile) return;
    const nextPhotos = profile.photo_urls.filter((photo) => photo !== url);
    setProfile({ ...profile, photo_urls: nextPhotos });
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_urls: nextPhotos, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (updateError) {
      setProfile(profile);
      setError("We couldn't remove that photo. Please try again.");
    }
  }

  async function removeVideo() {
    if (!profile) return;
    setProfile({ ...profile, intro_video_url: null });
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ intro_video_url: null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (updateError) {
      setProfile(profile);
      setError("We couldn't remove your intro video. Please try again.");
    }
  }

  if (!profile) {
    return <div className="px-6 py-10 text-ink-soft bg-cream min-h-screen">Loading…</div>;
  }

  const answeredPrompts = prompts.filter((p) => p.answer.trim().length > 0).length;
  const missing: string[] = [];
  let score = 20;
  if (profile.photo_urls.length > 0) score += 20;
  else missing.push("add a photo");
  if (selectedInterests.length >= 3) score += 20;
  else missing.push("add at least 3 interests");
  if (answeredPrompts >= 2) score += 20;
  else missing.push("answer at least 2 prompts");
  if (profile.bio.trim().length > 0) score += 20;
  else missing.push("add a tagline");
  const starsFilled = Math.round(score / 20);

  return (
    <div className="max-w-md mx-auto px-6 pt-10 pb-28 bg-cream min-h-screen text-ink">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{profile.display_name}</h1>
          <div className="mt-0.5 flex items-center gap-1.5" aria-label={`Profile strength: ${score}%`}>
            <span className="text-sm text-brand" aria-hidden="true">{"★".repeat(starsFilled)}</span>
            <span className="text-sm text-ink-faint" aria-hidden="true">{"☆".repeat(5 - starsFilled)}</span>
            <span className="text-xs text-ink-faint">{score}%</span>
          </div>
        </div>
        <Link href="/app/discover" className="text-sm font-semibold text-ink-soft">Done</Link>
      </div>

      <div className="mb-6 space-y-2 rounded-xl border border-brand/20 bg-brand-soft/60 p-4">
        {missing.length > 0 && (
          <p className="text-xs text-brand-dark flex items-start gap-1.5">
            <span aria-hidden="true">💡</span>
            <span><span className="font-semibold">Next step to reach 100%:</span> Add {missing.join(" and ")}.</span>
          </p>
        )}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 border-b border-line"><button type="button" onClick={() => setProfileTab("edit")} className={`min-h-12 border-b-4 text-base font-bold ${profileTab === "edit" ? "border-ink text-ink" : "border-transparent text-ink-faint"}`}>Edit</button><button type="button" onClick={() => setProfileTab("view")} className={`min-h-12 border-b-4 text-base font-bold ${profileTab === "view" ? "border-ink text-ink" : "border-transparent text-ink-faint"}`}>View</button></div>
      {profileTab === "view" && <section className="mb-6 space-y-4">{profile.photo_urls[0] && <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-line">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={profile.photo_urls[0]} alt="Profile preview" className="h-full w-full object-cover" /></div>}<div className="rounded-2xl border border-line bg-card p-5"><h2 className="text-2xl font-extrabold">{profile.display_name}</h2>{profile.bio && <p className="mt-2 leading-relaxed text-ink-soft">{profile.bio}</p>}</div><div className="rounded-2xl border border-line bg-card px-4">{DETAIL_FIELDS.filter(([key]) => visibility[key]).map(([key, label]) => <div key={key} className="border-b border-line py-4 last:border-0"><p className="font-bold">{label}</p><p className="mt-1 text-ink-soft">{details[key]}</p></div>)}<div className="py-4"><p className="font-bold">Dating intentions</p><p className="mt-1 text-ink-soft">{DATING_INTENTIONS.find((option) => option.value === relationshipIntent)?.label ?? "Open to exploring"}</p></div></div></section>}

      <Link href="/app/preferences" className="mb-5 flex min-h-14 items-center justify-between rounded-2xl border border-line bg-card px-4 font-bold text-ink hover:border-brand">
        <span>Dating preferences</span><span className="text-brand">Edit</span>
      </Link>
      <Link href="/app/settings" className="mb-5 flex min-h-14 items-center justify-between rounded-2xl border border-line bg-card px-4 font-bold text-ink hover:border-brand">
        <span>Settings &amp; safety</span><span className="text-brand">Edit</span>
      </Link>

      <div className={profileTab === "edit" ? "space-y-5" : "hidden"}>
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold">Photos</h2>
              <p className="text-xs text-ink-soft mt-1">Add up to 6 photos. Your first photo is your main profile photo. Use recent photos of yourself only—no minors, nudity, or contact details.</p>
            </div>
            <span className="text-xs font-bold text-brand shrink-0">{profile.photo_urls.length}/6</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {profile.photo_urls.map((url, index) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Profile photo ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 min-h-8 min-w-8 rounded-full bg-ink/80 px-2 text-xs font-bold text-white"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {profile.photo_urls.length < 6 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-cream px-3 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand">
                Choose from library
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={mediaSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMedia(file, "photo");
                    event.currentTarget.value = "";
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
                  disabled={mediaSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMedia(file, "photo");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          )}
          {mediaSaving && <p className="mt-3 text-xs font-medium text-brand">Uploading your media…</p>}
        </section>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            Display name
          </label>
          <input
            value={profile.display_name}
            onChange={(e) =>
              setProfile({ ...profile, display_name: e.target.value })
            }
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">City</label>
          <select
            value={profile.city_id}
            onChange={(e) =>
              setProfile({ ...profile, city_id: Number(e.target.value) })
            }
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <section className="space-y-3">
          <div>
            <label className="text-sm text-ink-soft block font-medium">Interests</label>
            <p className="text-xs text-ink-faint">Tap chips to add, or type a custom one and press Enter.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {INTEREST_CHIPS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`min-h-11 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                    isSelected
                      ? "bg-brand text-white border-brand"
                      : "bg-cream text-ink-soft border-line hover:border-line-strong"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}{interest}
                </button>
              );
            })}
            {selectedInterests
              .filter((interest) => !INTEREST_CHIPS.includes(interest))
              .map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className="min-h-11 px-4 py-2 rounded-full text-sm font-semibold border bg-brand text-white border-brand"
                >
                  ✓ {interest}
                </button>
              ))}
          </div>
          <input
            type="text"
            placeholder="Add a custom interest (press Enter)"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={addCustomInterest}
            className="w-full rounded-xl bg-card border border-line px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </section>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            What&rsquo;s one thing someone should know about you?
          </label>
          <input
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Describe yourself in one sentence"
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-line">
          <p className="text-sm font-bold mb-3">Your 3 prompts</p>
          {prompts.map((p, i) => (
            <div key={i} className="mb-4 rounded-2xl border border-line bg-cream p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-faint uppercase tracking-wide">Prompt {i + 1}</span>
                <button
                  type="button"
                  onClick={() => handleAiPrompt(i)}
                  disabled={aiLoadingIndex !== null}
                  className="text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
                >
                  {aiLoadingIndex === i ? "Writing…" : "✨ Need ideas?"}
                </button>
              </div>
              <select
                value={p.question}
                onChange={(e) => updatePromptQuestion(i, e.target.value)}
                className="w-full rounded-xl bg-card border border-line px-3 py-2 text-sm font-semibold outline-none focus:border-brand transition-colors"
              >
                {PROMPT_BANK.map((q) => (
                  <option key={q} value={q} disabled={usedQuestions.has(q) && q !== p.question}>
                    {q}
                  </option>
                ))}
              </select>
              <textarea
                rows={2}
                maxLength={150}
                placeholder="Type your answer here…"
                value={p.answer}
                onChange={(e) => updatePromptAnswer(i, e.target.value)}
                className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors resize-none"
              />
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-bold">Intro video <span className="text-ink-faint font-medium">(optional)</span></h2>
          <p className="text-xs text-ink-soft mt-1">A short, authentic video helps people get to know you. Up to 50 MB. Keep it respectful and do not include minors or private contact details.</p>
          {profile.intro_video_url ? (
            <div className="mt-3">
              <video src={profile.intro_video_url} controls playsInline className="w-full rounded-xl bg-ink" />
              <button type="button" onClick={removeVideo} className="mt-2 min-h-11 text-sm font-semibold text-red-600 hover:text-red-700">Remove video</button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-cream px-3 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand">
                Choose video
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  disabled={mediaSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMedia(file, "video");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-brand px-3 text-sm font-bold text-white hover:bg-brand-dark">
                Record a video
                <input
                  type="file"
                  accept="video/*"
                  capture="user"
                  className="sr-only"
                  disabled={mediaSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMedia(file, "video");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">Complete your profile</h2><span className="text-xs text-ink-faint">Optional</span></div>
          <p className="mt-1 text-xs text-ink-soft">A few more questions to help you get better matches. Skip for now and come back anytime — nothing here is required to start matching.</p>
          <div className="mt-3">
            {DETAIL_FIELDS.map(([key, label, options]) => (
              <div key={key} className="border-b border-line py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{label}</span>
                    <select value={details[key]} onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full bg-transparent text-base text-ink-soft outline-none">
                      {options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setVisibility((current) => ({ ...current, [key]: !current[key] }))}
                    className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                    style={{ backgroundColor: visibility[key] ? "var(--color-brand, #b45309)" : "var(--color-line, #e5e5e5)" }}
                    aria-pressed={visibility[key]}
                    aria-label={`${visibility[key] ? "Hide" : "Show"} ${label} on your public profile`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${visibility[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-bold">Dating preferences</h2>
          <p className="mt-1 text-xs text-ink-soft">These set your normal daily-match range.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm text-ink-soft">Minimum age<input type="number" min="18" max="99" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" /></label>
            <label className="text-sm text-ink-soft">Maximum age<input type="number" min="18" max="99" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" /></label>
          </div>
          <label className="mt-3 block text-sm text-ink-soft">I&rsquo;m looking for<select value={relationshipIntent} onChange={(e) => setRelationshipIntent(e.target.value as RelationshipIntent)} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand">{DATING_INTENTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-10 pt-6 border-t border-line">
          <p className="text-sm font-bold text-ink-soft mb-1">Danger zone</p>
          <p className="text-xs text-ink-faint mb-3">
            Permanently deletes your profile, matches, messages, and
            subscription. This can&rsquo;t be undone.
          </p>
          <button
            onClick={async () => {
              if (
                !confirm(
                  "Delete your account? This permanently removes your profile, matches, and messages and can't be undone."
                )
              ) {
                return;
              }
              setDeleting(true);
              const res = await fetch("/api/account/delete", { method: "POST" });
              if (res.ok) {
                router.push("/");
              } else {
                setDeleting(false);
                setError("Couldn't delete your account. Try again.");
              }
            }}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-cream/95 p-4 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <span className="text-xs text-ink-soft">{saved ? "Saved ✓" : "Unsaved changes are not lost—save when ready"}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
