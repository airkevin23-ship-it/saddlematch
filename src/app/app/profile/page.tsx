"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES, PROMPT_BANK, isAiPromoActive, AI_FREE_PROMO_LABEL } from "@/lib/constants";
import ProfileMedia from "@/components/profile-media";
import NeighbourhoodSelect from "@/components/neighbourhood-select";
import VoicePromptRecorder from "@/components/voice-prompt-recorder";
import SaddleUpPicker from "@/components/saddle-up-picker";
import { spotLabel } from "@/lib/saddle-up";
import DetailRowList from "@/components/detail-row-list";
import type { Profile, Prompt, RelationshipIntent } from "@/types/db";
import {
  ALWAYS_VISIBLE,
  DETAIL_FIELDS,
  type DetailKey,
  type Details,
} from "@/lib/profile-details";

// Presentation only: how the About You rows are grouped in the editor. The
// field list itself stays in @/lib/profile-details so it cannot drift.
const DETAIL_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Background",
    keys: ["work", "education", "faith", "ethnicity", "relationshipType"],
  },
  {
    title: "Life",
    keys: ["children", "familyPlans", "hometown", "austinStatus", "pets"],
  },
  {
    title: "Lifestyle",
    keys: ["languages", "politics", "drinking", "smoking", "marijuana", "drugs"],
  },
];


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
	  const [editTab, setEditTab] = useState<"photos" | "basics" | "about" | "prompts">("photos");

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
        preference_details: { ...(profile.preference_details ?? {}), profile: { values: details, visibility: { ...visibility, age: true, height: true } } } as unknown as Record<string, string>,
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
        <h1 className="mt-6 font-serif-heading text-3xl font-bold tracking-tight">You&rsquo;re ready.</h1>
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
        <h1 className="font-serif-heading text-xl font-bold tracking-tight">Your profile</h1>
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
        {(profile.photo_urls ?? []).length > 0 ? (
          <ProfileMedia
            photoUrls={(profile.photo_urls ?? []).slice(0, 1)}
            alt="Profile preview"
          />
        ) : null}

            <div className="px-5 pt-5">
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
                    <div key={i}>
                      <div className="rounded-2xl border border-line bg-cream p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{p.question}</p>
                      <p className="mt-2 font-display text-[22px] leading-[1.35] text-ink">{p.answer}</p>
                      </div>
                      {(profile.photo_urls ?? [])[i + 1] ? (
                        <div className="mt-3 -mx-5 overflow-hidden rounded-2xl">
                          <ProfileMedia photoUrls={[(profile.photo_urls ?? [])[i + 1]]} alt="Profile photo" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {/* These render in Preview too, otherwise a member fills them in
                  and then cannot see them anywhere. */}
              {(profile.saddle_up_spots?.length || profile.saddle_up_headline) && (
                <div className="mt-5 rounded-2xl border border-line bg-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Saddle Up Together</p>
                  {profile.saddle_up_spots && profile.saddle_up_spots.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.saddle_up_spots.map((id) => (
                        <span key={id} className="rounded-full bg-line px-2.5 py-1 text-xs font-semibold">
                          {spotLabel(id)}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.saddle_up_headline && (
                    <p className="mt-3 text-base font-medium leading-relaxed">
                      &ldquo;{profile.saddle_up_headline}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {profile.voice_prompt_url && (
                <div className="mt-5 rounded-2xl border border-line bg-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                    {profile.voice_prompt_question ?? "Voice prompt"}
                  </p>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio src={profile.voice_prompt_url} controls className="mt-2 w-full" />
                </div>
              )}


              <DetailRowList
                heading="About me"
                rows={DETAIL_FIELDS
                  .filter(([key]) => (ALWAYS_VISIBLE.includes(key) || visibility[key]) && details[key] && details[key] !== "Not answered yet")
                  .map(([key, label]) => ({ key, label, value: details[key] }))}
              />
          {/* Photos left over after interleaving, then the intro video last.
              The video is the closer, not the opener. */}
          {(profile.photo_urls ?? []).slice(answeredPrompts.length + 1).length > 0 && (
            <div className="mt-5 space-y-3">
              {(profile.photo_urls ?? []).slice(answeredPrompts.length + 1).map((src) => (
                <div key={src} className="-mx-5 overflow-hidden rounded-2xl">
                  <ProfileMedia photoUrls={[src]} alt="Profile photo" />
                </div>
              ))}
            </div>
          )}
          {profile.intro_video_url && (
            <div className="mt-5 -mx-5 overflow-hidden rounded-2xl">
              <ProfileMedia videoUrl={profile.intro_video_url} alt="Intro video" />
            </div>
          )}
            </div>
          </div>
        </section>
      )}

      <div className={profileTab === "edit" ? "space-y-5" : "hidden"}>
				        <div className="mb-6 flex w-full rounded-full bg-line p-1">
									{([["photos", "Photos"], ["basics", "Basics"], ["about", "About You"], ["prompts", "Prompts"]] as const).map(([value, label]) => (
			            <button
										              key={value}
										              type="button"
										              onClick={() => setEditTab(value)}
										              className={`flex-1 min-h-10 rounded-full text-sm font-bold transition-colors ${
																		                editTab === value ? "bg-card text-ink shadow-sm" : "text-ink-faint"
																	}`}
										            >
										{label}
											</button>
			          ))}
								</div>
				{editTab === "photos" && (
			        <>
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
          <h2 className="font-bold">Saddle Up Together</h2>
          <SaddleUpPicker
            profileId={profile.id}
            initialSpots={profile.saddle_up_spots}
            initialHeadline={profile.saddle_up_headline}
            onSaved={(v) =>
              setProfile((current) =>
                current
                  ? { ...current, saddle_up_spots: v.spots, saddle_up_headline: v.headline }
                  : current,
              )
            }
          />
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-bold">Voice prompt <span className="text-ink-faint font-medium">(optional)</span></h2>
          <p className="text-xs text-ink-soft mt-1">
            Up to 30 seconds. Hearing someone speak tells you more than a photo does.
            Keep it respectful and do not share private contact details.
          </p>
          <VoicePromptRecorder
            profileId={profile.id}
            initialUrl={profile.voice_prompt_url}
            initialQuestion={profile.voice_prompt_question}
            initialDurationMs={profile.voice_prompt_duration_ms}
            onSaved={(v) =>
              setProfile((current) =>
                current
                  ? {
                      ...current,
                      voice_prompt_url: v.url,
                      voice_prompt_question: v.question,
                      voice_prompt_duration_ms: v.durationMs,
                    }
                  : current,
              )
            }
          />
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-bold">Intro video <span className="text-ink-faint font-medium">(optional)</span></h2>
          <p className="text-xs text-ink-soft mt-1">A short, authentic video helps people get to know you. Up to 50 MB. Keep it respectful and do not include minors or private contact details.</p>
          {profile.intro_video_url ? (
            <div className="mt-3">
              <video src={profile.intro_video_url} controls playsInline className="aspect-square w-full rounded-xl bg-ink object-cover" />
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
							</>)}

				{editTab === "basics" && (
			<>
			<div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            Name
          </label>
          <input
            value={profile.display_name}
            onChange={(e) =>
              setProfile({ ...profile, display_name: e.target.value })
            }
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Age and height live beside the name because they are the same kind of
            thing: who you are. Burying age among the lifestyle questions was what
            made this page feel disorganised. */}
        {DETAIL_FIELDS.filter(([key]) => key === "age" || key === "height").map(([key, label, options]) => (
          <div key={key}>
            <label className="text-sm text-ink-soft block mb-1 font-semibold" htmlFor={`basic-${key}`}>
              {label}
            </label>
            <select
              id={`basic-${key}`}
              value={details[key]}
              onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))}
              className="w-full rounded-xl bg-card border border-line px-3 py-3 text-base"
            >
              {(options as readonly string[]).map((option) => (
                <option key={option} value={option}>{option.split(" (")[0]}</option>
              ))}
            </select>
          </div>
        ))}

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
			</>)}

				{editTab === "about" && (
			<>
			<section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">About you</h2><span className="text-xs text-ink-faint">Visible controls</span></div>
          <p className="mt-1 text-xs text-ink-soft">Choose what to share on your public profile. You can change this anytime.</p>
          <div className="mt-4 space-y-7">
            {DETAIL_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="flex items-center gap-2">
                  <p className="font-display text-base font-bold text-ink">{group.title}</p>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="mt-2 rounded-2xl border border-line bg-cream/40 px-4">
                  {DETAIL_FIELDS.filter(([key]) => group.keys.includes(key)).map(([key, label, options]) => (
                    <div key={key} className="border-b border-line py-3 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <label className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</span>
                          <select
                            value={details[key]}
                            onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))}
                            className="mt-0.5 w-full bg-transparent text-base font-semibold text-ink outline-none"
                          >
                            {(options as readonly string[]).map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        {/* Only speak up when something is hidden. Sixteen rows all
                            shouting "Visible" told the member nothing. */}
                        {!ALWAYS_VISIBLE.includes(key) && (
                          <button
                            type="button"
                            onClick={() => setVisibility((current) => ({ ...current, [key]: !current[key] }))}
                            aria-label={visibility[key] ? `Hide ${label}` : `Show ${label}`}
                            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${visibility[key] ? "text-ink-faint" : "bg-line text-ink-soft"}`}
                          >
                            {visibility[key] ? "Hide" : "Hidden"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
			</>)}

				{editTab === "prompts" && (
			<>
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
                {aiLoadingIndex === i ? "Writing…" : `✨ Help me answer (AI, ${isAiPromoActive() ? AI_FREE_PROMO_LABEL : "Plus"})`}
              </button>
            </div>
          ))}
        </div>
			</>)}

      </div>

      <div className="fixed inset-x-0 bottom-[5rem] z-40 mx-auto w-full max-w-md border-t border-line bg-card/95 px-6 py-4 backdrop-blur shadow-[0_-4px_16px_rgba(27,25,23,0.08)]">
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
