"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SADDLE_UP_SPOTS, SADDLE_UP_GROUPS } from "@/lib/saddle-up";

// Saddle Up Together picker.
//
// Two different jobs, deliberately kept apart:
//
//  - The chips come from a fixed list, because overlap only works if two
//    people are choosing from the same set of ids. This is what the app can
//    match on and show as "you both picked".
//  - The free-text idea is theirs alone. Somebody new to Austin will not
//    recognise these names, and a picker with nothing they know is a dead end.
//    It is shown on the profile but never matched on, because free text cannot
//    be compared reliably.

const MAX_SPOTS = 16;

export default function SaddleUpPicker({
  profileId,
  initialSpots,
  initialHeadline,
  onSaved,
}: {
  profileId: string;
  initialSpots?: string[] | null;
  initialHeadline?: string | null;
  onSaved?: (v: { spots: string[]; headline: string | null }) => void;
}) {
  const supabase = createClient();
  const [spots, setSpots] = useState<string[]>(initialSpots ?? []);
  const [headline, setHeadline] = useState(initialHeadline ?? "");
  const [savingIdea, setSavingIdea] = useState(false);
  const [savedIdea, setSavedIdea] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(nextSpots: string[], nextHeadline: string | null) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        saddle_up_spots: nextSpots,
        saddle_up_headline: nextHeadline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    return updateError;
  }

  async function toggle(id: string) {
    const previous = spots;
    const next = spots.includes(id)
      ? spots.filter((s) => s !== id)
      : spots.length >= MAX_SPOTS
        ? spots
        : [...spots, id];
    if (next === spots) return;
    setSpots(next);
    setError(null);
    const updateError = await persist(next, headline.trim() || null);
    if (updateError) {
      setSpots(previous);
      setError("We could not save that. Please try again.");
      return;
    }
    onSaved?.({ spots: next, headline: headline.trim() || null });
  }

  async function saveIdea() {
    setSavingIdea(true);
    setSavedIdea(false);
    setError(null);
    const value = headline.trim() || null;
    const updateError = await persist(spots, value);
    setSavingIdea(false);
    if (updateError) {
      setError("We could not save your idea. Please try again.");
      return;
    }
    setSavedIdea(true);
    onSaved?.({ spots, headline: value });
  }

  return (
    <div>
      <p className="text-xs text-ink-soft">
        Pick the places you would actually go. When you match with someone, you
        will both see what you have in common \u2014 it makes the first message easy.
      </p>

      {SADDLE_UP_GROUPS.map((group) => (
        <div key={group} className="mt-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{group}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {SADDLE_UP_SPOTS.filter((s) => s.group === group).map((s) => {
              const on = spots.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  title={s.note}
                  className={
                    "min-h-11 rounded-full border px-3.5 text-sm font-semibold transition-colors " +
                    (on
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-cream text-ink-soft hover:border-brand hover:text-brand")
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="mt-3 text-xs text-ink-faint">
        {spots.length} picked{spots.length >= MAX_SPOTS ? " \u00b7 that is the limit" : ""}
      </p>

      <div className="mt-5 rounded-xl border border-line bg-cream p-3">
        <label className="block text-xs font-semibold text-ink" htmlFor="saddle-up-idea">
          Or your own idea
        </label>
        <p className="mt-1 text-xs text-ink-soft">
          Somewhere that is yours. New to Austin? Say what you would like to try.
        </p>
        <input
          id="saddle-up-idea"
          type="text"
          maxLength={80}
          value={headline}
          onChange={(e) => {
            setHeadline(e.target.value);
            setSavedIdea(false);
          }}
          placeholder="Tacos and a long walk by the water"
          className="mt-2 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm"
        />
        <button
          type="button"
          onClick={saveIdea}
          disabled={savingIdea}
          className="mt-2 min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-cream disabled:opacity-50"
        >
          {savingIdea ? "Saving\u2026" : savedIdea ? "Saved" : "Save idea"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
