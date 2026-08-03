// Common Ground — what two members actually have in common.
//
// The overlap is computed here in plain code, grounded in real data read
// from the public_profiles view (which already filters each detail field
// by that member's own visibility toggle, so nothing private leaks in).
// The AI is only ever asked to *rephrase* a list we already computed,
// never to invent or guess. This matters: showing someone a fabricated
// "you both want kids" would be a trust problem, not just a copy problem.
//
// Because it's deterministic it costs nothing to run, returns instantly,
// and produces the identical result for both people in a pair.

import type { Prompt, RelationshipIntent } from "@/types/db";

export type CommonGroundKind = "interest" | "detail" | "intent" | "city" | "prompt";

export interface CommonGroundItem {
  kind: CommonGroundKind;
  /** Short chip text shown in the UI, e.g. "Live music". */
  label: string;
  /** Contribution to the score. Not shown to members. */
  weight: number;
}

/** The subset of public_profiles this module reads. */
export interface CompatibilityProfile {
  city_id?: number | null;
  interests?: string[] | null;
  relationship_intent?: RelationshipIntent | string | null;
  prompts?: Prompt[] | null;
  /** public_profiles.visible_details — already visibility-filtered. */
  visible_details?: Record<string, string> | null;
}

export interface CommonGround {
  items: CommonGroundItem[];
  /** 0–100, used for ordering and thresholds only — never displayed. */
  score: number;
  sharedInterests: string[];
  sameCity: boolean;
  alignedIntent: boolean;
  /** Plain-text one-liner, e.g. "3 shared interests · Both in Austin". */
  summary: string;
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/** Lowercase, strip accents/punctuation, collapse spaces, drop a trailing "s". */
function normalise(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base.length > 3 && base.endsWith("s") ? base.slice(0, -1) : base;
}

// Western-lifestyle terms that mean the same thing to a member but get
// typed differently. Each row collapses to its first entry, so "Trail
// rides" and "Horseback riding" count as one shared interest, not two.
const SYNONYM_GROUPS: string[][] = [
  ["horses", "horseback riding", "riding", "trail rides", "equestrian", "barrel racing"],
  ["rodeo", "bull riding", "roping", "team roping"],
  ["country music", "live music", "honky tonk", "country concerts"],
  ["two-stepping", "line dancing", "dancing", "dance halls"],
  ["bbq", "barbecue", "grilling", "brisket", "smoking meat"],
  ["ranch life", "ranching", "farm", "farming", "cattle", "livestock"],
  ["hunting", "fishing", "camping", "hiking", "outdoors"],
  ["road trips", "off-roading", "trucks"],
  ["dogs", "pets", "puppies"],
  ["faith", "church", "bible study"],
  ["family", "family time", "family dinners"],
  ["cooking", "baking", "home cooking"],
];

const SYNONYM_LOOKUP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const group of SYNONYM_GROUPS) {
    const canonical = normalise(group[0]);
    for (const term of group) map.set(normalise(term), canonical);
  }
  return map;
})();

/** Reduce a raw interest string to a comparable key. */
export function canonicalInterest(value: string): string {
  const n = normalise(value);
  return SYNONYM_LOOKUP.get(n) ?? n;
}

// ---------------------------------------------------------------------------
// Dating intent
// ---------------------------------------------------------------------------

type IntentBucket = "serious" | "casual" | "open";

const INTENT_BUCKETS: Record<string, IntentBucket> = {
  long_term: "serious",
  life_partner: "serious",
  marriage: "serious",
  short_term: "casual",
  casual: "casual",
  friendship: "open",
  figuring_it_out: "open",
  open_to_either: "open",
};

const INTENT_PHRASES: Record<IntentBucket, string> = {
  serious: "Both looking for something serious",
  casual: "Both keeping it casual",
  open: "Both open to seeing where it goes",
};

/**
 * Aligned when both want the same kind of thing, or when at least one is
 * explicitly open. Serious vs. casual is the one real mismatch — we never
 * claim alignment there.
 */
function intentAlignment(
  a: string | null | undefined,
  b: string | null | undefined
): { aligned: boolean; label: string | null } {
  if (!a || !b) return { aligned: false, label: null };
  const bucketA = INTENT_BUCKETS[a];
  const bucketB = INTENT_BUCKETS[b];
  if (!bucketA || !bucketB) return { aligned: false, label: null };
  if (bucketA === bucketB) return { aligned: true, label: INTENT_PHRASES[bucketA] };
  if (bucketA === "open" || bucketB === "open") {
    const other = bucketA === "open" ? bucketB : bucketA;
    return { aligned: true, label: INTENT_PHRASES[other] };
  }
  return { aligned: false, label: null };
}

// ---------------------------------------------------------------------------
// Visible detail fields
// ---------------------------------------------------------------------------

const DETAIL_LABELS: Record<string, string> = {
  politics: "politics",
  religion: "faith",
  languages: "language",
  relationshipType: "relationship style",
  drinking: "drinking",
  smoking: "smoking",
  marijuana: "marijuana",
  drugs: "drugs",
  children: "kids",
  familyPlans: "family plans",
  education: "education",
  westernLifestyle: "western lifestyle",
};

// Values from the profile editor's dropdowns that mean "no real answer".
// Two people both leaving a field untouched is the absence of a
// preference, not something in common.
const PLACEHOLDER_VALUES = new Set([
  "not answered yet",
  "prefer not to say",
  "open to all",
  "no preference",
  "doesn't matter",
  "any",
  "",
]);

function detailOverlaps(
  a: Record<string, string> | null | undefined,
  b: Record<string, string> | null | undefined
): CommonGroundItem[] {
  if (!a || !b) return [];
  const items: CommonGroundItem[] = [];
  for (const key of Object.keys(DETAIL_LABELS)) {
    const av = (a[key] ?? "").trim();
    const bv = (b[key] ?? "").trim();
    if (!av || !bv) continue;
    if (PLACEHOLDER_VALUES.has(av.toLowerCase())) continue;
    if (PLACEHOLDER_VALUES.has(bv.toLowerCase())) continue;
    if (normalise(av) !== normalise(bv)) continue;
    items.push({
      kind: "detail",
      label: `${DETAIL_LABELS[key]}: ${av.toLowerCase()}`,
      weight: key === "westernLifestyle" ? 14 : 7,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/** Prompts both members chose to answer — a natural thing to compare notes on. */
function sharedPromptQuestions(
  a: Prompt[] | null | undefined,
  b: Prompt[] | null | undefined
): string[] {
  if (!a?.length || !b?.length) return [];
  const answeredB = new Set(
    b.filter((p) => p?.answer?.trim()).map((p) => normalise(p.question))
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const prompt of a) {
    if (!prompt?.answer?.trim()) continue;
    const key = normalise(prompt.question);
    if (answeredB.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(prompt.question);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const WEIGHTS = { interest: 12, city: 18, intent: 22, prompt: 8 } as const;
const MAX_SHARED_INTERESTS = 4;

export function computeCommonGround(
  me: CompatibilityProfile,
  other: CompatibilityProfile,
  options?: { cityName?: string | null }
): CommonGround {
  const items: CommonGroundItem[] = [];

  // Shared interests — keyed by canonical form, labelled how the viewer wrote it.
  const mineByKey = new Map<string, string>();
  for (const raw of me.interests ?? []) {
    if (raw?.trim()) mineByKey.set(canonicalInterest(raw), raw.trim());
  }
  const sharedInterests: string[] = [];
  const seen = new Set<string>();
  for (const raw of other.interests ?? []) {
    if (!raw?.trim()) continue;
    const key = canonicalInterest(raw);
    if (!mineByKey.has(key) || seen.has(key)) continue;
    seen.add(key);
    sharedInterests.push(mineByKey.get(key) ?? raw.trim());
  }
  for (const interest of sharedInterests.slice(0, MAX_SHARED_INTERESTS)) {
    items.push({ kind: "interest", label: interest, weight: WEIGHTS.interest });
  }

  // Same city
  const sameCity = me.city_id != null && other.city_id != null && me.city_id === other.city_id;
  if (sameCity) {
    items.push({
      kind: "city",
      label: options?.cityName ? `Both in ${options.cityName}` : "Same city",
      weight: WEIGHTS.city,
    });
  }

  // Dating intent
  const intent = intentAlignment(me.relationship_intent, other.relationship_intent);
  if (intent.aligned && intent.label) {
    items.push({ kind: "intent", label: intent.label, weight: WEIGHTS.intent });
  }

  // Visible details
  items.push(...detailOverlaps(me.visible_details, other.visible_details));

  // Shared prompt
  const shared = sharedPromptQuestions(me.prompts, other.prompts);
  if (shared.length) {
    items.push({
      kind: "prompt",
      label: `Both answered "${shared[0].replace(/[…:]+$/, "")}"`,
      weight: WEIGHTS.prompt,
    });
  }

  const score = Math.min(100, items.reduce((total, item) => total + item.weight, 0));

  return {
    items,
    score,
    sharedInterests,
    sameCity,
    alignedIntent: intent.aligned,
    summary: buildSummary(sharedInterests, sameCity, options?.cityName ?? null, intent.aligned),
  };
}

function buildSummary(
  sharedInterests: string[],
  sameCity: boolean,
  cityName: string | null,
  alignedIntent: boolean
): string {
  const parts: string[] = [];
  if (sharedInterests.length === 1) parts.push(`You both like ${sharedInterests[0].toLowerCase()}`);
  else if (sharedInterests.length > 1) parts.push(`${sharedInterests.length} shared interests`);
  if (sameCity) parts.push(cityName ? `Both in ${cityName}` : "Same city");
  if (alignedIntent) parts.push("Looking for the same thing");
  return parts.join(" · ");
}

/**
 * Compact chips for the UI — concrete things first, capped so cards stay
 * clean. Item labels stay lowercase internally because that reads better
 * as AI input; capitalisation happens here, at the display edge.
 */
export function commonGroundChips(ground: CommonGround, limit = 4): string[] {
  const order: CommonGroundKind[] = ["interest", "detail", "city", "intent", "prompt"];
  return [...ground.items]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .slice(0, limit)
    .map((item) => {
      if (item.kind !== "detail") {
        return item.label.charAt(0).toUpperCase() + item.label.slice(1);
      }
      // "faith: christian" -> "Faith · Christian"
      const [field, ...rest] = item.label.split(": ");
      const value = rest.join(": ");
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return value ? `${cap(field)} · ${cap(value)}` : cap(field);
    });
}

/** Enough real overlap to be worth showing at all. */
export function hasMeaningfulCommonGround(ground: CommonGround): boolean {
  return ground.items.length > 0 && ground.score >= 12;
}

/**
 * Asks the model to rephrase — never to invent. Each item goes in, the
 * same number of phrases comes back, in the same order, so the output can
 * be zipped straight back onto the items we computed.
 */
export function buildPhrasingPrompt(items: CommonGroundItem[]): string {
  const lines = items
    .map((item, i) => {
      if (item.kind === "interest") return `${i + 1}. shared interest: "${item.label}"`;
      if (item.kind === "intent") return `${i + 1}. both looking for: "${item.label}"`;
      if (item.kind === "city") return `${i + 1}. both live in: "${item.label}"`;
      if (item.kind === "prompt") return `${i + 1}. both answered the prompt: "${item.label}"`;
      return `${i + 1}. shared trait: "${item.label}"`;
    })
    .join("\n");

  return `Two people on a dating app have these things in common. Turn each one into a short checklist phrase (2-5 words, lowercase, present tense, no "you both" prefix — just the phrase itself, e.g. "love live music", "enjoy hiking", "want a long-term relationship", "drink socially").

${lines}

Rules:
- Return exactly ${items.length} phrase(s), in the same order as the list above.
- Do not add, remove, or invent items — only rephrase what's given.
- No emojis, no trailing punctuation.
- Return a JSON array of exactly ${items.length} string(s), nothing else.`;
}
