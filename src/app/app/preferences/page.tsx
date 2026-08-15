"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AREA_SECTIONS, AREA_SECTION_LABELS, type AreaSection } from "@/lib/constants";
import type { Gender, Profile, RelationshipIntent } from "@/types/db";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "nonbinary", label: "Nonbinary people" },
  { value: "other", label: "Other" },
];

const DATING_INTENTIONS: { value: RelationshipIntent; label: string }[] = [
  { value: "long_term", label: "Long-term relationship" },
  { value: "life_partner", label: "Life partner" },
  { value: "marriage", label: "Marriage" },
  { value: "short_term", label: "Short-term relationship" },
  { value: "casual", label: "Casual dating" },
  { value: "friendship", label: "Friendship first" },
  { value: "figuring_it_out", label: "Figuring it out" },
  { value: "open_to_either", label: "Open to exploring" },
];

const OPTIONS = {
  children: ["Open to all", "Has children", "Doesn't have children", "Wants children", "Doesn't want children"],
  familyPlans: ["Open to all", "Wants a family", "Open to a family", "Doesn't want children"],
  smoking: ["Open to all", "Never", "Sometimes", "Regularly"],
  drinking: ["Open to all", "Never", "Sometimes", "Socially", "Regularly"],
  marijuana: ["Open to all", "Never", "Sometimes", "Regularly"],
  religion: ["Open to all", "Christian", "Catholic", "Jewish", "Muslim", "Spiritual", "Other"],
  politics: ["Open to all", "Conservative", "Moderate", "Liberal", "Not political"],
  height: ["Open to all", "5'0\"+", "5'4\"+", "5'8\"+", "6'0\"+"],
  relationshipType: ["Open to all", "Monogamous", "Non-monogamous", "Figuring it out"],
  ethnicity: ["Open to all", "Asian", "Black", "Hispanic / Latino", "Middle Eastern", "Native American", "White", "Multiracial", "Other"],
  languages: ["Open to all", "English", "Spanish", "English and Spanish", "Other"],
  education: ["Open to all", "High school", "Some college", "Bachelor's degree", "Graduate degree", "Trade / technical"],
  westernLifestyle: ["Open to all", "Owns horses", "Rides often", "Ranch or farm life", "Rodeo and western events"],
} as const;

type DetailKey = keyof typeof OPTIONS;
type Details = Record<DetailKey, string>;
const DETAIL_LABELS: Record<DetailKey, string> = {
  children: "Children",
  familyPlans: "Family plans",
  smoking: "Smoking",
  drinking: "Drinking",
  marijuana: "Marijuana",
  religion: "Religion",
  politics: "Politics",
  height: "Height",
  relationshipType: "Relationship Type",
  ethnicity: "Ethnicity",
  languages: "Languages",
  education: "Education",
  westernLifestyle: "Western Lifestyle",
};
const DETAIL_ICONS: Record<DetailKey, string> = {
  children: "👶",
  familyPlans: "👨‍👩‍👧",
  smoking: "🚬",
  drinking: "🍺",
  marijuana: "🌿",
  religion: "🙏",
  politics: "🗳️",
  height: "📏",
  relationshipType: "❤️",
  ethnicity: "🌍",
  languages: "🗣️",
  education: "🎓",
  westernLifestyle: "🤠",
};
// Friendlier copy for the default "Open to all" option, shown per field so the
// list doesn't repeat the same phrase a dozen times. The underlying stored
// value stays "Open to all" for every field — only the visible label changes.
const OPEN_LABELS: Partial<Record<DetailKey, string>> = {
  relationshipType: "No preference",
  children: "Doesn't matter",
  familyPlans: "Doesn't matter",
  westernLifestyle: "No preference",
  smoking: "Doesn't matter",
  drinking: "Doesn't matter",
  marijuana: "Doesn't matter",
  religion: "No preference",
  politics: "No preference",
  education: "Any",
  languages: "Any",
  height: "No preference",
  ethnicity: "No preference",
};
const defaults: Details = Object.fromEntries(
  Object.entries(OPTIONS).map(([key, values]) => [key, values[0]])
) as Details;

const CORE_KEYS: DetailKey[] = ["relationshipType", "children", "familyPlans"];
const LIFESTYLE_KEYS: DetailKey[] = ["drinking", "smoking", "marijuana", "religion", "politics", "education", "languages"];
const OPTIONAL_KEYS: DetailKey[] = ["height"];
// Ethnicity is the one preference where "pick exactly one" doesn't reflect
// how people actually feel about it - someone open to White or Hispanic
// matches shouldn't have to throw away the filter entirely and see everyone.
// It's rendered as its own toggle-chip block (same pattern as gender/areas
// below) instead of going through the shared single-select PreferenceRow.
// The chosen values are still stored as one comma-joined string in
// details.ethnicity - preference_details is a free-form string map with no
// per-key schema, and nothing downstream reads ethnicity yet, so no
// migration or type change is needed to support multiple values here.

function PreferenceRow({ icon, label, value, options, openLabel, onChange }: { icon: string; label: string; value: string; options: readonly string[]; openLabel?: string; onChange: (value: string) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-line py-4 last:border-b-0">
      <span className="flex items-center gap-2 font-bold">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="flex items-center gap-1 text-ink-soft">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="appearance-none bg-transparent text-right text-base outline-none">
          {options.map((option) => <option key={option} value={option}>{option === "Open to all" && openLabel ? openLabel : option}</option>)}
        </select>
        <span aria-hidden="true" className="text-ink-faint">›</span>
      </span>
    </label>
  );
}

export default function PreferencesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [intent, setIntent] = useState<RelationshipIntent>("open_to_either");
  const [details, setDetails] = useState<Details>(defaults);
  const [otherDetails, setOtherDetails] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [areas, setAreas] = useState<AreaSection[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!data) return;
      setProfile(data);
      setGenders(data.interested_in ?? []);
      setMinAge(data.min_age ?? 18);
      setMaxAge(data.max_age ?? 99);
      setIntent(data.relationship_intent ?? "open_to_either");
      const savedPreferences = (data.preference_details ?? {}) as Record<string, unknown>;
      const { profile: _profileDetails, location: _locationDetails, areas: savedAreas, distance: _legacyDistance, ...savedFilters } = savedPreferences;
      setAreas(Array.isArray(savedAreas) ? (savedAreas as AreaSection[]) : []);
      setOtherDetails({
        ...(_profileDetails ? { profile: _profileDetails } : {}),
        ...(_locationDetails ? { location: _locationDetails } : {}),
      });
      setDetails({ ...defaults, ...savedFilters } as Details);
      setDirty(false);
    })();
  }, [supabase]);

  function toggleGender(gender: Gender) {
    setGenders((current) => current.includes(gender) ? current.filter((item) => item !== gender) : [...current, gender]);
    setDirty(true);
  }

  function toggleArea(section: AreaSection) {
    setAreas((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]);
    setDirty(true);
  }

  function changeMinAge(value: number) {
    setMinAge(value);
    setDirty(true);
  }

  function changeMaxAge(value: number) {
    setMaxAge(value);
    setDirty(true);
  }

  function changeIntent(value: RelationshipIntent) {
    setIntent(value);
    setDirty(true);
  }

  function changeDetail(key: DetailKey, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function toggleEthnicity(option: string) {
    if (option === "Open to all") {
      changeDetail("ethnicity", "Open to all");
      return;
    }
    const current = details.ethnicity && details.ethnicity !== "Open to all" ? details.ethnicity.split(", ") : [];
    const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
    changeDetail("ethnicity", next.length > 0 ? next.join(", ") : "Open to all");
  }

  async function save() {
    if (!profile || minAge < 18 || maxAge < minAge) {
      setMessage("Choose a valid age range.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("profiles").update({
      interested_in: genders,
      min_age: minAge,
      max_age: maxAge,
      relationship_intent: intent,
      preference_details: { ...otherDetails, ...details, areas } as unknown as Record<string, string>,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    if (error) {
      setMessage("Couldn't save your preferences. Try again.");
      setSaving(false);
      return;
    }

    setDirty(false);
    setSaving(false);

    // Preferences is a close-when-done screen — the header only offers ×.
    // Saving should take you back the same way the × does, otherwise the
    // button looks like it did nothing.
    router.push("/app/profile");
  }

  if (!profile) return <div className="min-h-screen bg-cream px-6 py-10 text-ink-soft">Loading preferences...</div>;

  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      <header className="sticky top-0 z-10 flex min-h-16 items-center border-b border-line bg-cream/95 px-4 backdrop-blur">
        <Link href="/app/profile" className="grid min-h-11 min-w-11 place-items-center text-2xl" aria-label="Back to profile">×</Link>
        <h1 className="ml-2 text-2xl font-extrabold tracking-tight">Dating Preferences</h1>
      </header>
      <main className="mx-auto max-w-xl px-4 py-5">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-xl font-extrabold">Keep your options open</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Set the qualities you&apos;re looking for. Leave anything as &ldquo;Open to all&rdquo; to see more potential matches.</p>
        </div>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Core preferences</p>
          <div className="mt-2 rounded-2xl border border-line bg-card px-4">
            <div className="border-b border-line py-4">
              <p className="flex items-center gap-2 font-bold"><span aria-hidden="true">👥</span>I&apos;m interested in</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENDERS.map((gender) => <button key={gender.value} type="button" onClick={() => toggleGender(gender.value)} className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${genders.includes(gender.value) ? "border-brand bg-brand text-white" : "border-line text-ink-soft"}`}>{gender.label}</button>)}
              </div>
            </div>
            <div className="border-b border-line py-4">
              <div className="rounded-xl border-2 border-brand/30 bg-brand-soft/40 p-3">
                <p className="flex items-center gap-2 font-bold">
                  <span aria-hidden="true">🤠</span>Western Lifestyle Compatibility
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">This is what makes SaddleMatch different. Tell us how you live so we can find someone who gets it.</p>
                <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
                  <select value={details.westernLifestyle} onChange={(event) => changeDetail("westernLifestyle", event.target.value)} className="w-full appearance-none bg-transparent text-base font-semibold outline-none">
                    {OPTIONS.westernLifestyle.map((option) => <option key={option} value={option}>{option === "Open to all" ? OPEN_LABELS.westernLifestyle : option}</option>)}
                  </select>
                  <span aria-hidden="true" className="text-ink-faint">›</span>
                </label>
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-line py-4">
              <span className="flex items-center gap-2 font-bold"><span aria-hidden="true">🎯</span>Dating intention</span>
              <span className="flex items-center gap-1 text-ink-soft">
                <select value={intent} onChange={(event) => changeIntent(event.target.value as RelationshipIntent)} className="appearance-none bg-transparent text-right text-base outline-none">
                  {DATING_INTENTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <span aria-hidden="true" className="text-ink-faint">›</span>
              </span>
            </label>
            {CORE_KEYS.map((key) => <PreferenceRow key={key} icon={DETAIL_ICONS[key]} label={DETAIL_LABELS[key]} value={details[key]} options={OPTIONS[key]} openLabel={OPEN_LABELS[key]} onChange={(value) => changeDetail(key, value)} />)}
            <div className="border-b border-line py-4">
              <p className="flex items-center gap-2 font-bold"><span aria-hidden="true">📍</span>Areas I&apos;d travel to</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">Austin traffic is real. Pick the areas you&apos;d actually drive to for a date. Leave them all off to see the whole metro.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AREA_SECTIONS.map((section) => <button key={section} type="button" onClick={() => toggleArea(section)} className={`min-h-10 rounded-full border px-3 text-left text-sm font-semibold ${areas.includes(section) ? "border-brand bg-brand text-white" : "border-line text-ink-soft"}`}>{AREA_SECTION_LABELS[section]}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 py-4">
              <label className="text-sm font-bold">🎂 Minimum age<input type="number" min="18" max="99" value={minAge} onChange={(event) => changeMinAge(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base font-normal outline-none focus:border-brand" /></label>
              <label className="text-sm font-bold">🎂 Maximum age<input type="number" min="18" max="99" value={maxAge} onChange={(event) => changeMaxAge(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base font-normal outline-none focus:border-brand" /></label>
            </div>
          </div>
        </section>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Lifestyle</p>
          <div className="mt-2 rounded-2xl border border-line bg-card px-4">
            {LIFESTYLE_KEYS.map((key) => <PreferenceRow key={key} icon={DETAIL_ICONS[key]} label={DETAIL_LABELS[key]} value={details[key]} options={OPTIONS[key]} openLabel={OPEN_LABELS[key]} onChange={(value) => changeDetail(key, value)} />)}
          </div>
        </section>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Optional</p>
          <div className="mt-2 rounded-2xl border border-line bg-card px-4">
            {OPTIONAL_KEYS.map((key) => <PreferenceRow key={key} icon={DETAIL_ICONS[key]} label={DETAIL_LABELS[key]} value={details[key]} options={OPTIONS[key]} openLabel={OPEN_LABELS[key]} onChange={(value) => changeDetail(key, value)} />)}
            <div className="border-b border-line py-4 last:border-b-0">
              <p className="flex items-center gap-2 font-bold"><span aria-hidden="true">{DETAIL_ICONS.ethnicity}</span>{DETAIL_LABELS.ethnicity}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">Select every ethnicity you&apos;re open to matching with.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {OPTIONS.ethnicity.map((option) => {
                  const ethnicityValues = details.ethnicity && details.ethnicity !== "Open to all" ? details.ethnicity.split(", ") : [];
                  const active = option === "Open to all" ? ethnicityValues.length === 0 : ethnicityValues.includes(option);
                  return (
                    <button key={option} type="button" onClick={() => toggleEthnicity(option)} className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${active ? "border-brand bg-brand text-white" : "border-line text-ink-soft"}`}>
                      {option === "Open to all" ? OPEN_LABELS.ethnicity : option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        <p className="mt-6 text-center text-sm leading-relaxed text-ink-soft">These preferences help us curate your daily match. You can change them anytime.</p>
        {message && <p className="mt-4 text-center text-sm font-semibold text-red-600">{message}</p>}
        <button onClick={save} disabled={saving || !dirty} className="mt-3 min-h-12 w-full rounded-xl bg-brand font-bold text-white disabled:opacity-40">{saving ? "Saving..." : dirty ? "Save preferences" : "No changes to save"}</button>
      </main>
    </div>
  );
}
