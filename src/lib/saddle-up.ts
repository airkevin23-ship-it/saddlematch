// Saddle Up Together — the Austin places and things members say they would
// actually go do. The point is the overlap: when two people match, the app
// shows what they BOTH picked, so a first message has something to be about.
//
// These are places our members like. Nothing here is a partner, a sponsor or
// an endorsement, and the app never books anything — two people agree between
// themselves.
//
// Every venue below was checked as trading in August 2026. Places close, so
// this list needs a look over before each launch push.

export type SaddleUpSpot = {
  id: string;
  label: string;
  group: "Dance halls & live music" | "Barbecue & food" | "Outdoors" | "Nights & seasons" | "Easy first meets";
  note?: string;
};

export const SADDLE_UP_SPOTS: SaddleUpSpot[] = [
  { id: "broken-spoke", label: "The Broken Spoke", group: "Dance halls & live music", note: "South Lamar, honky-tonk since 1964" },
  { id: "white-horse", label: "The White Horse", group: "Dance halls & live music", note: "East Austin, live music seven nights" },
  { id: "sagebrush", label: "Sagebrush", group: "Dance halls & live music", note: "South Congress, free two-step lessons" },
  { id: "continental-club", label: "The Continental Club", group: "Dance halls & live music", note: "South Congress" },
  { id: "gruene-hall", label: "Gruene Hall", group: "Dance halls & live music", note: "New Braunfels, worth the drive" },

  { id: "franklin", label: "Franklin Barbecue", group: "Barbecue & food", note: "Lunch only, and the queue is the date" },
  { id: "terry-blacks", label: "Terry Black\u2019s", group: "Barbecue & food", note: "Barton Springs Road" },
  { id: "la-barbecue", label: "la Barbecue", group: "Barbecue & food", note: "East Austin" },
  { id: "salt-lick", label: "The Salt Lick", group: "Barbecue & food", note: "Driftwood, bring your own" },

  { id: "barton-springs", label: "Barton Springs", group: "Outdoors" },
  { id: "lady-bird-trail", label: "The Lady Bird Lake trail", group: "Outdoors" },
  { id: "trail-ride", label: "A morning trail ride", group: "Outdoors", note: "Horses, early, quiet" },

  { id: "two-step-lesson", label: "A two-step lesson", group: "Nights & seasons", note: "Beginners welcome" },
  { id: "western-swing", label: "Live Western swing", group: "Nights & seasons" },
  { id: "rodeo-austin", label: "Rodeo Austin", group: "Nights & seasons", note: "Spring" },

  { id: "soco-coffee", label: "Coffee and vintage on South Congress", group: "Easy first meets" },
  { id: "mueller-market", label: "The Mueller farmers market", group: "Easy first meets", note: "Sunday mornings" },
];

export const SADDLE_UP_GROUPS = [
  "Dance halls & live music",
  "Barbecue & food",
  "Outdoors",
  "Nights & seasons",
  "Easy first meets",
] as const;

export function spotLabel(id: string): string {
  return SADDLE_UP_SPOTS.find((s) => s.id === id)?.label ?? id;
}

// The shared picks are the whole payoff, so this is deliberately its own
// function rather than an inline filter somewhere in a page component.
export function sharedSpots(a: string[] | null | undefined, b: string[] | null | undefined): SaddleUpSpot[] {
  const mine = new Set(a ?? []);
  return SADDLE_UP_SPOTS.filter((s) => mine.has(s.id) && (b ?? []).includes(s.id));
}
