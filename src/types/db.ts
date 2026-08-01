export type Gender = "male" | "female" | "nonbinary" | "other";
export type RelationshipIntent = "long_term" | "life_partner" | "marriage" | "short_term" | "casual" | "friendship" | "figuring_it_out" | "open_to_either";

export type CitySlug = "houston" | "austin" | "dallas" | "san-antonio";

export interface City {
  id: number;
  slug: CitySlug;
  name: string;
}

export interface Prompt {
  question: string;
  answer: string;
}

export interface Profile {
  id: string;
  display_name: string;
  birthdate: string;
  gender: Gender;
  interested_in: Gender[];
  min_age: number;
  max_age: number;
  relationship_intent: RelationshipIntent;
  preference_details?: Record<string, string>;
  city_id: number;
  bio: string;
  interests: string[];
  photo_urls: string[];
  intro_video_url?: string | null;
  prompts: Prompt[];
  is_active: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

// The other-member-facing shape, read from the `public_profiles` view.
// Deliberately excludes birthdate and interested_in — never send a
// member's exact date of birth or their private matching preference
// to another user's browser. Age is computed server-side instead.
export interface PublicProfile {
  id: string;
  display_name: string;
  age: number;
  gender: Gender;
  city_id: number;
  bio: string;
  interests: string[];
  photo_urls: string[];
  intro_video_url?: string | null;
  prompts: Prompt[];
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  target_id: string;
  action: "like" | "pass";
  like_comment: string | null;
  liked_prompt_index: number | null;
  created_at: string;
}

export interface DailyQueue {
  user_id: string;
  queue_date: string;
  candidate_ids: string[];
  updated_at: string;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  match_reason: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "active" | "trialing" | "canceled" | "past_due" | "inactive";
  current_period_end: string | null;
  updated_at: string;
}
