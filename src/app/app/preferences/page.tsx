"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  distance: ["Within 25 miles", "Within 50 miles", "Within 100 miles", "Anywhere in Texas"],
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
const defaults: Details = Object.fromEntries(
  Object.entries(OPTIONS).map(([key, values]) => [key, values[0]])
) as Details;

function PreferenceRow({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block border-b border-line py-4 last:border-b-0">
      <span className="font-bold">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full appearance-none bg-transparent text-lg text-ink-soft outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function PreferencesPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [intent, setIntent] = useState<RelationshipIntent>("open_to_either");
  const [details, setDetails] = useState<Details>(defaults);
  const [otherDetails, setOtherDetails] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      const { profile: _profileDetails, location: _locationDetails, ...savedFilters } = savedPreferences;
      setOtherDetails({
        ...(_profileDetails ? { profile: _profileDetails } : {}),
        ...(_locationDetails ? { location: _locationDetails } : {}),
      });
      setDetails({ ...defaults, ...savedFilters } as Details);
    })();
  }, [supabase]);

  function toggleGender(gender: Gender) {
    setGenders((current) => current.includes(gender) ? current.filter((item) => item !== gender) : [...current, gender]);
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
      preference_details: { ...otherDetails, ...details } as Record<string, string>,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setMessage(error ? "Couldn't save your preferences. Try again." : "Preferences saved.");
    setSaving(false);
  }

  if (!profile) return <div className="min-h-screen bg-cream px-6 py-10 text-ink-soft">Loading preferences...</div>;

  const changeDetail = (key: DetailKey, value: string) => setDetails((current) => ({ ...current, [key]: value }));
  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      <header className="sticky top-0 z-10 flex min-h-16 items-center border-b border-line bg-cream/95 px-4 backdrop-blur">
        <Link href="/app/profile" className="grid min-h-11 min-w-11 place-items-center text-2xl" aria-label="Back to profile">×</Link>
        <h1 className="ml-2 text-2xl font-extrabold tracking-tight">Dating Preferences</h1>
      </header>
      <main className="mx-auto max-w-xl px-4 py-5">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-xl font-extrabold">Keep your options open</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Set your ideal preferences. Choose Open to all whenever you want a broader mix without changing your core priorities.</p>
        </div>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Member preferences</p>
          <div className="mt-2 rounded-2xl border border-line bg-card px-4">
            <div className="border-b border-line py-4">
              <p className="font-bold">I&apos;m interested in</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENDERS.map((gender) => <button key={gender.value} type="button" onClick={() => toggleGender(gender.value)} className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${genders.includes(gender.value) ? "border-brand bg-brand text-white" : "border-line text-ink-soft"}`}>{gender.label}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-b border-line py-4">
              <label className="text-sm font-bold">Minimum age<input type="number" min="18" max="99" value={minAge} onChange={(event) => setMinAge(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base font-normal outline-none focus:border-brand" /></label>
              <label className="text-sm font-bold">Maximum age<input type="number" min="18" max="99" value={maxAge} onChange={(event) => setMaxAge(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-base font-normal outline-none focus:border-brand" /></label>
            </div>
            <PreferenceRow label="Maximum distance" value={details.distance} options={OPTIONS.distance} onChange={(value) => changeDetail("distance", value)} />
            <label className="block py-4"><span className="font-bold">Dating intention</span><select value={intent} onChange={(event) => setIntent(event.target.value as RelationshipIntent)} className="mt-1 w-full appearance-none bg-transparent text-lg text-ink-soft outline-none">{DATING_INTENTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
        </section>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">More preferences</p>
          <div className="mt-2 rounded-2xl border border-line bg-card px-4">
            {(Object.keys(OPTIONS).filter((key) => key !== "distance") as DetailKey[]).map((key) => <PreferenceRow key={key} label={key === "familyPlans" ? "Family plans" : key[0].toUpperCase() + key.slice(1)} value={details[key]} options={OPTIONS[key]} onChange={(value) => changeDetail(key, value)} />)}
          </div>
        </section>
        {message && <p className="mt-4 text-center text-sm font-semibold text-brand">{message}</p>}
        <button onClick={save} disabled={saving} className="mt-6 min-h-12 w-full rounded-xl bg-brand font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save preferences"}</button>
      </main>
    </div>
  );
}
