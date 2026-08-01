import { CitySlug } from "@/types/db";

export const CITIES: { slug: CitySlug; name: string; id: number }[] = [
  { id: 1, slug: "houston", name: "Houston" },
  { id: 2, slug: "austin", name: "Austin" },
  { id: 3, slug: "dallas", name: "Dallas" },
  { id: 4, slug: "san-antonio", name: "San Antonio" },
];

export const APP_NAME = "SaddleMatch";
export const TAGLINE = "Dating for the Western Lifestyle";
export const SUBSCRIPTION_PRICE_LABEL = "$9.99/mo";
export const SUBSCRIPTION_INTRO_PRICE_LABEL = "$4.99/mo";
export const SUBSCRIPTION_INTRO_PERIOD = "for your first 3 months";
export const PLUS_FEATURES: string[] = [
  "AI profile feedback and rewrites",
  "Better conversation starters",
  "\u201cWhat you have in common\u201d match insights",
  "More daily curated matches",
  "See who liked your profile",
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
