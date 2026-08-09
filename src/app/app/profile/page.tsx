"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES, PROMPT_BANK } from "@/lib/constants";
import ProfileMedia from "@/components/profile-media";
import NeighbourhoodSelect from "@/components/neighbourhood-select";
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
  const [today] = useState(() => Date.now());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interestsInput, setInterestsInput] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent>("open_to_either");
  const [saving, setSaving] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"edit" | "view">("view");
  const [celebrate, setCelebrate] = useState(false);
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
        setInterestsInput((data.interests ?? []).join(", "));
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
          interests: interestsInput.split(",").map((s) => s.trim()).filter(Boolean),
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
        interests: interestsInput.split(",").map((s) => s.trim()).filter(Boolean),
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
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);

    // Saving from the editor should hand you back to your profile. Leaving
    // someone parked at the bottom of a long form, with only a 2-second label
    // change on a footer they have scrolled past, reads as "nothing happened".
    if (completionScore >= 100) {
      setCelebrate(true);
      return;
    }
    setProfileTab("view");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // photo_urls[0] is the main profile photo shown in Discover, so reordering
  // is really "choose what people see first". Arrows rather than drag: touch
  // dragging inside a scrolling page is unreliable, and buttons work with
  // screen readers.
  async function reorderPhotos(nextPhotos: string[]) {
    if (!profile) return;
    const previous = profile;
    setProfile({ ...profile, photo_urls: nextPhotos });
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_urls: nextPhotos, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (updateError) {
      setProfile(previous);
      setError("We could not save your photo order. Please try again.");
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    if (!profile) return;
    const target = index + direction;
    if (target < 0 || target >= profile.photo_urls.length) return;
    const next = [...profile.photo_urls];
    const held = next[index];
    next[index] = next[target];
    next[target] = held;
    void reorderPhotos(next);
  }

  function makeMainPhoto(index: number) {
    if (!profile || index === 0) return;
    const next = [...profile.photo_urls];
    const chosen = next.splice(index, 1)[0];
    next.unshift(chosen);
    void reorderPhotos(next);
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

  const trimmedInterests = interestsInput.split(",").map((s) => s.trim()).filter(Boolean);
  const checklist = [
    { label: "Photo", done: profile.photo_urls.length > 0 },
    { label: "Prompts", done: prompts.some((p) => p.answer.trim().length > 0) },
    { label: "Intentions", done: Boolean(relationshipIntent) },
    { label: "Interests", done: trimmedInterests.length >= 3 },
    { label: "Tagline", done: Boolean(profile.bio && profile.bio.trim()) },
  ];
  const completedCount = checklist.filter((item) => item.done).length;
  const completionScore = Math.round((completedCount / checklist.length) * 100);
  const answeredPrompts = prompts.filter((p) => p.answer.trim().length > 0);
  const age = profile.birthdate
    ? Math.floor((today - new Date(profile.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const cityName = CITIES.find((c) => c.id === profile.city_id)?.name;
  const intentionLabel = DATING_INTENTIONS.find((option) => option.value === relationshipIntent)?.label ?? "Open to exploring";
  const saveLabel = saving
    ? "Saving…"
    : saved
    ? "Saved ✓"
    : completionScore >= 100
    ? "Start Matching"
    : completionScore >= 80
    ? "Complete Profile"
    : "Save & Continue";

  if (celebrate) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-8 pb-28 text-center text-ink">
        <span className="text-6xl" aria-hidden="true">🌵</span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">You&rsquo;re ready.</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          We&rsquo;ll start looking for your first match.
        </p>
        <p className="mt-1 text-base leading-relaxed text-ink-soft">
          See you in tomorrow&rsquo;s roundup.
        </p>
        <Link
          href="/app/discover"
          className="mt-9 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-brand px-6 font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
        >
          Go to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-40 bg-cream min-h-screen text-ink">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">Your profile</h1>
        <Link href="/app/discover" className="text-sm font-semibold text-ink-soft">Done</Link>
      </div>

      {completionScore < 100 && (
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-brand/20 bg-brand-soft/40 px-4 py-3">
          <span className="shrink-0 text-2xl font-extrabold leading-none text-brand">{completionScore}%</span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">Complete your profile</p>
            <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
              {checklist.map((item) => (
                <span
                  key={item.label}
                  className={`text-[11px] leading-none ${item.done ? "text-ink-faint" : "font-semibold text-ink"}`}
                >
                  {item.done ? "✓" : "○"} {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex w-full rounded-full bg-line p-1">
        <button
          type="button"
          onClick={() => setProfileTab("view")}
          className={`flex-1 min-h-10 rounded-full text-sm font-bold transition-colors ${
            profileTab === "view" ? "bg-card text-ink shadow-sm" : "text-ink-faint"
          }`}
        >
          👁 Preview
        </button>
        <button
          type="button"
          onClick={() => setProfileTab("edit")}
          className={`flex-1 min-h-10 rounded-full text-sm font-bold transition-colors ${
            profileTab === "edit" ? "bg-card text-ink shadow-sm" : "text-ink-faint"
          }`}
        >
          ✏️ Edit Profile
        </button>
      </div>

      {profileTab === "view" && (
        <section className="mb-8">
          {/* Same shell, spacing and type scale as the Discover card, so
              "Preview" really is what another member sees. */}
          <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06]">
            <ProfileMedia
              photoUrls={profile.photo_urls}
              videoUrl={profile.intro_video_url}
              alt="Profile preview"
            />

            <div className="p-5">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {profile.display_name}{age ? `, ${age}` : ""}
              </h2>
              {profile.bio && profile.bio.trim() && (
                <p className="mt-1 text-base leading-relaxed text-ink-soft">{profile.bio}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Based in</span><span className="font-semibold">{cityName ?? "Austin"}</span></div>
                <div className="rounded-xl bg-cream px-3 py-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Looking for</span><span className="font-semibold">{intentionLabel}</span></div>
              </div>

              {trimmedInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {trimmedInterests.map((interest) => (
                    <span key={interest} className="rounded-full bg-line px-2.5 py-1 text-xs font-medium text-ink-soft">{interest}</span>
                  ))}
                </div>
              )}

              {answeredPrompts.length > 0 && (
                <div className="mt-5 space-y-3">
                  {answeredPrompts.map((p, i) => (
                    <div key={i} className="rounded-2xl border border-line bg-cream p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{p.question}</p>
                      <p className="mt-2 text-base font-medium leading-relaxed">{p.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {DETAIL_FIELDS.filter(([key]) => visibility[key]).length > 0 && (
                <div className="mt-5 rounded-2xl border border-line bg-cream px-4">
                  {DETAIL_FIELDS.filter(([key]) => visibility[key]).map(([key, label]) => (
                    <div key={key} className="border-b border-line py-3 last:border-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
                      <p className="mt-0.5 font-semibold">{details[key]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 min-h-8 min-w-8 rounded-full bg-ink/80 px-2 text-xs font-bold text-white"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  ×
                </button>
                <div className="absolute inset-x-0 bottom-0 flex items-stretch justify-between bg-ink/70">
                  <button
                    type="button"
                    onClick={() => movePhoto(index, -1)}
                    disabled={index === 0}
                    className="min-h-8 flex-1 text-sm font-bold text-white disabled:opacity-30"
                    aria-label={`Move photo ${index + 1} earlier`}
                  >
                    ‹
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeMainPhoto(index)}
                      className="min-h-8 px-1 text-[9px] font-bold uppercase tracking-wide text-white"
                      aria-label={`Make photo ${index + 1} your main photo`}
                    >
                      Main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => movePhoto(index, 1)}
                    disabled={index === profile.photo_urls.length - 1}
                    className="min-h-8 flex-1 text-sm font-bold text-white disabled:opacity-30"
                    aria-label={`Move photo ${index + 1} later`}
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}
          </div>
          {profile.photo_urls.length > 1 && (
            <p className="mt-2 text-xs text-ink-soft">
              The photo marked <span className="font-semibold text-ink">Main</span> is what people see
              first in Discover. Use the arrows to reorder.
            </p>
          )}
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

        <NeighbourhoodSelect
          value={profile.city_id}
          onChange={(id) => setProfile({ ...profile, city_id: id })}
          label="Neighbourhood"
        />

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            Interests (comma-separated)
          </label>
          <input
            value={interestsInput}
            onChange={(e) => setInterestsInput(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            One-line tagline (optional)
          </label>
          <input
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
        </div>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-bold">Dating preferences</h2>
          <p className="mt-1 text-xs text-ink-soft">These set your normal daily-match range.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm text-ink-soft">Minimum age<input type="number" min="18" max="99" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" /></label>
            <label className="text-sm text-ink-soft">Maximum age<input type="number" min="18" max="99" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand" /></label>
          </div>
          <label className="mt-3 block text-sm text-ink-soft">I&rsquo;m looking for<select value={relationshipIntent} onChange={(e) => setRelationshipIntent(e.target.value as RelationshipIntent)} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none focus:border-brand">{DATING_INTENTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">About you</h2><span className="text-xs text-ink-faint">Visible controls</span></div>
          <p className="mt-1 text-xs text-ink-soft">Choose what to share on your public profile. You can change this anytime.</p>
          <div className="mt-3">{DETAIL_FIELDS.map(([key, label, options]) => <div key={key} className="border-b border-line py-3 last:border-0"><div className="flex items-center justify-between gap-3"><label className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><select value={details[key]} onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full bg-transparent text-base text-ink-soft outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label><button type="button" onClick={() => setVisibility((current) => ({ ...current, [key]: !current[key] }))} className={`min-h-9 rounded-lg px-2 text-xs font-bold ${visibility[key] ? "bg-brand-soft text-brand-dark" : "bg-line text-ink-faint"}`}>{visibility[key] ? "Visible" : "Hidden"}</button></div></div>)}</div>
        </section>

        <div className="pt-4 border-t border-line">
          <p className="text-sm font-bold mb-3">Your 3 prompts</p>
          {prompts.map((p, i) => (
            <div key={i} className="mb-5">
              <select
                value={p.question}
                onChange={(e) => updatePromptQuestion(i, e.target.value)}
                className="w-full rounded-xl bg-card border border-line px-3 py-2 text-sm outline-none focus:border-brand mb-1 transition-colors"
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
                className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors"
              />
              <button
                onClick={() => handleAiPrompt(i)}
                disabled={aiLoadingIndex !== null}
                className="mt-1 text-xs text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
              >
                {aiLoadingIndex === i ? "Writing…" : "✨ Help me answer (AI, Plus)"}
              </button>
            </div>
          ))}
        </div>

      </div>

      <div className="fixed inset-x-0 bottom-[4.5rem] z-40 mx-auto w-full max-w-md border-t border-line bg-card/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {error && <p className="mb-2 text-center text-sm font-semibold text-red-600">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3.5 rounded-full font-bold transition-colors min-h-12"
          >
            {saveLabel}
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">Unsaved changes are not lost—save when ready.</p>
        </div>
      </div>
    </div>
  );
}
