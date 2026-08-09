// Shared "About You" field definitions.
//
// This list is the single source of truth. The profile editor renders it to
// collect answers, and Discover renders the answers back to other members. It
// lives here rather than inside a page component so the two cannot drift
// apart: a field added here shows up in both places or neither.

export const DETAIL_FIELDS = [
  // The questions people actually scan for first. Height and ethnicity lead
  // because they are the two most-asked and the two Kevin flagged as missing.
  ["height", "Height", ["Not answered yet", "4′ 0″ (122 cm)", "4′ 1″ (124 cm)", "4′ 2″ (127 cm)", "4′ 3″ (130 cm)", "4′ 4″ (132 cm)", "4′ 5″ (135 cm)", "4′ 6″ (137 cm)", "4′ 7″ (140 cm)", "4′ 8″ (142 cm)", "4′ 9″ (145 cm)", "4′ 10″ (147 cm)", "4′ 11″ (150 cm)", "5′ 0″ (152 cm)", "5′ 1″ (155 cm)", "5′ 2″ (157 cm)", "5′ 3″ (160 cm)", "5′ 4″ (163 cm)", "5′ 5″ (165 cm)", "5′ 6″ (168 cm)", "5′ 7″ (170 cm)", "5′ 8″ (173 cm)", "5′ 9″ (175 cm)", "5′ 10″ (178 cm)", "5′ 11″ (180 cm)", "6′ 0″ (183 cm)", "6′ 1″ (185 cm)", "6′ 2″ (188 cm)", "6′ 3″ (191 cm)", "6′ 4″ (193 cm)", "6′ 5″ (196 cm)", "6′ 6″ (198 cm)", "6′ 7″ (201 cm)", "6′ 8″ (203 cm)", "6′ 9″ (206 cm)", "6′ 10″ (208 cm)", "6′ 11″ (211 cm)", "7′ 0″ (213 cm)", "7′ 1″ (216 cm)", "7′ 2″ (218 cm)", "7′ 3″ (221 cm)", "7′ 4″ (224 cm)", "7′ 5″ (226 cm)", "7′ 6″ (229 cm)"]],
  ["ethnicity", "Ethnicity", ["Not answered yet", "American Indian", "Black", "East Asian", "Hispanic or Latino", "Middle Eastern", "Pacific Islander", "South Asian", "Southeast Asian", "White", "Multiracial", "Other", "Prefer not to say"]],
  ["children", "Children", ["Not answered yet", "Don\u2019t have children", "Have children", "Prefer not to say"]],
  ["familyPlans", "Family plans", ["Not answered yet", "Want children", "Don\u2019t want children", "Open to children", "Not sure yet", "Prefer not to say"]],
  ["relationshipType", "Relationship type", ["Not answered yet", "Monogamous", "Open to exploring", "Prefer not to say"]],

  // Who you are day to day.
  ["work", "Work", ["Not answered yet", "Ranching or agriculture", "Trades", "Healthcare", "Education", "Service industry", "Tech", "Business", "Creative", "Military or first responder", "Student", "Other", "Prefer not to say"]],
  ["education", "Education", ["Not answered yet", "High school", "Trade school", "Some college", "Undergraduate degree", "Graduate degree", "Prefer not to say"]],
  ["faith", "Religious beliefs", ["Not answered yet", "Christian", "Catholic", "Jewish", "Muslim", "Hindu", "Buddhist", "Spiritual", "Agnostic", "Atheist", "Other", "Prefer not to say"]],
  ["hometown", "Hometown", ["Not answered yet", "Austin born and raised", "Elsewhere in Texas", "Another state", "Another country", "Prefer not to say"]],
  ["austinStatus", "Austin is", ["Not answered yet", "Home for good", "Home for now", "Just passing through", "Still deciding"]],
  ["pets", "Pets", ["Not answered yet", "Dog", "Cat", "Horse", "Other pets", "No pets", "Prefer not to say"]],

  // Lower down on purpose. These matter to some people and to nobody else,
  // and putting them first made the editor feel like an interrogation.
  ["languages", "Languages spoken", ["Not answered yet", "English", "Spanish", "English and Spanish", "Other"]],
  ["politics", "Politics", ["Prefer not to say", "Conservative", "Moderate", "Liberal", "Not political"]],
  ["drinking", "Drinking", ["Not answered yet", "No", "Sometimes", "Socially", "Regularly"]],
  ["smoking", "Smoking", ["Not answered yet", "No", "Sometimes", "Yes"]],
  ["marijuana", "Marijuana", ["Not answered yet", "No", "Sometimes", "Yes"]],
  ["drugs", "Drugs", ["Not answered yet", "No", "Prefer not to say"]],
] as const

export type DetailKey = (typeof DETAIL_FIELDS)[number][0];
export type Details = Record<DetailKey, string>;

// Height is always shown. It is one of the first things people look for, and
// a profile that hides it reads as evasive rather than private.
export const ALWAYS_VISIBLE: DetailKey[] = ["height"];

const LABELS = new Map<string, string>(
  DETAIL_FIELDS.map(([key, label]) => [key, label]),
);

export function detailLabel(key: string) {
  return LABELS.get(key) ?? key;
}

// A field that was never answered should be left out entirely. Printing
// "Height: Not answered yet" on someone's card is worse than printing nothing.
export function isAnswered(value: string | null | undefined) {
  return (
    !!value && value !== "Not answered yet" && value !== "Prefer not to say"
  );
}

// Height leads the card next to name and age, so it is returned on its own and
// excluded from the list below rather than printed twice. The stored value
// carries both units ("6′ 1″ (185 cm)"); the headline only needs the first.
export function heightOf(visible: Record<string, string> | null | undefined) {
  const raw = visible?.height;
  return isAnswered(raw) ? raw!.replace(/\s*\(.*\)$/, "") : null;
}

// Ordered by DETAIL_FIELDS so a card reads in the same order as the editor.
export function orderedDetails(
  visible: Record<string, string> | null | undefined,
) {
  if (!visible) return [];
  return DETAIL_FIELDS.filter(
    ([key]) => key !== "height" && isAnswered(visible[key]),
  ).map(([key, label]) => ({ key, label, value: visible[key] }));
}
