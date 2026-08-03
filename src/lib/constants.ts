// SaddleMatch launches Austin-only. What used to be a list of Texas
// cities is now the Austin metro broken into neighbourhoods, grouped by
// section. The `cities` table holds these rows and profiles.city_id
// still points at one, so nothing downstream had to be rewired.
//
// `CITIES` keeps its old name because several screens already import it;
// `NEIGHBOURHOODS` is the accurate name for new code.

export type AreaSection = "Austin" | "North" | "South" | "West" | "East";

export interface Neighbourhood {
  id: number;
  slug: string;
  name: string;
  section: AreaSection;
}

export const NEIGHBOURHOODS: Neighbourhood[] = [
  { id: 10, slug: "downtown", name: "Downtown", section: "Austin" },
  { id: 11, slug: "east-austin", name: "East Austin", section: "Austin" },
  { id: 12, slug: "south-congress", name: "South Congress", section: "Austin" },
  { id: 13, slug: "south-lamar", name: "South Lamar", section: "Austin" },
  { id: 14, slug: "zilker", name: "Zilker", section: "Austin" },
  { id: 15, slug: "hyde-park", name: "Hyde Park", section: "Austin" },
  { id: 16, slug: "mueller", name: "Mueller", section: "Austin" },
  { id: 17, slug: "the-domain", name: "The Domain", section: "Austin" },
  { id: 18, slug: "north-austin", name: "North Austin", section: "Austin" },
  { id: 19, slug: "south-austin", name: "South Austin", section: "Austin" },
  { id: 20, slug: "westlake", name: "Westlake", section: "Austin" },
  { id: 21, slug: "oak-hill", name: "Oak Hill", section: "Austin" },

  { id: 22, slug: "round-rock", name: "Round Rock", section: "North" },
  { id: 23, slug: "cedar-park", name: "Cedar Park", section: "North" },
  { id: 24, slug: "leander", name: "Leander", section: "North" },
  { id: 25, slug: "georgetown", name: "Georgetown", section: "North" },
  { id: 26, slug: "pflugerville", name: "Pflugerville", section: "North" },

  { id: 27, slug: "buda", name: "Buda", section: "South" },
  { id: 28, slug: "kyle", name: "Kyle", section: "South" },
  { id: 29, slug: "dripping-springs", name: "Dripping Springs", section: "South" },

  { id: 30, slug: "bee-cave", name: "Bee Cave", section: "West" },
  { id: 31, slug: "lakeway", name: "Lakeway", section: "West" },

  { id: 32, slug: "manor", name: "Manor", section: "East" },
  { id: 33, slug: "bastrop", name: "Bastrop", section: "East" },
];

/** Legacy export name — still imported by several screens. */
export const CITIES = NEIGHBOURHOODS;

/** Section order for the grouped dropdown. */
export const AREA_SECTIONS: AreaSection[] = ["Austin", "North", "South", "West", "East"];

/** Human label for a section, used in the "areas I'd travel to" picker. */
export const AREA_SECTION_LABELS: Record<AreaSection, string> = {
  Austin: "Austin",
  North: "North (Round Rock, Cedar Park…)",
  South: "South (Buda, Kyle…)",
  West: "West (Bee Cave, Lakeway…)",
  East: "East (Manor, Bastrop…)",
};

export function neighbourhoodById(id: number | null | undefined): Neighbourhood | undefined {
  if (id == null) return undefined;
  return NEIGHBOURHOODS.find((n) => n.id === id);
}

export function sectionForNeighbourhood(id: number | null | undefined): AreaSection | null {
  return neighbourhoodById(id)?.section ?? null;
}

/** Grouped for a sectioned dropdown, filtered by a free-text query. */
export function groupedNeighbourhoods(query = ""): { section: AreaSection; items: Neighbourhood[] }[] {
  const q = query.trim().toLowerCase();
  return AREA_SECTIONS.map((section) => ({
    section,
    items: NEIGHBOURHOODS.filter(
      (n) => n.section === section && (!q || n.name.toLowerCase().includes(q))
    ),
  })).filter((group) => group.items.length > 0);
}

export const APP_NAME = "SaddleMatch";
export const TAGLINE = "Dating for the Western Lifestyle";
export const LAUNCH_CITY = "Austin";
export const SUBSCRIPTION_PRICE_LABEL = "$9.99/month";
export const SUBSCRIPTION_INTRO_PRICE_LABEL = "$4.99/month";
export const SUBSCRIPTION_INTRO_PERIOD = "for your first 3 months";
export const PLUS_FEATURES: string[] = [
  "AI profile coach",
  "AI conversation help",
  "Better match insights",
  "See who liked you",
  "More curated matches",
];

// How many new candidates get curated into a user's queue each day
// (Coffee Meets Bagel / Crush style — capped, not infinite).
export const DAILY_QUEUE_SIZE = 8;

// Hinge-style prompt bank. Users pick 3 and write short answers —
// this replaces a blank "write your bio" box, which most people
// freeze up on, with specific, comment-able hooks.
export const PROMPT_BANK: string[] = [
  "My simple pleasures are…",
  "The way to win me over is…",
  "Unpopular opinion I'll defend…",
  "I'm convinced that…",
  "Two truths and a lie…",
  "My Texas summer survival kit includes…",
  "Best local spot for a first date…",
  "I geek out on…",
  "Sunday mornings look like…",
  "Ask me about…",
  "A life goal of mine is…",
  "Green flag I look for…",
  "Dating me is like…",
  "My friends would describe me as…",
  "Overshare something…",
];
