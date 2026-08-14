import type { ComponentType } from "react";
import type { DetailKey } from "@/lib/profile-details";
import {
  CalendarIcon,
  RulerIcon,
  BriefcaseIcon,
  BookIcon,
  SparkleIcon,
  GlobeIcon,
  BabyIcon,
  HouseIcon,
  ChatIcon,
  FlagIcon,
  CupIcon,
  SmokeIcon,
  LeafIcon,
  InfoCircleIcon,
  WesternStarIcon,
  CactusIcon,
  HorseshoeIcon,
  LassoHeartIcon,
} from "@/components/western-icons";

// One icon per "About me" detail field, in the icon-plus-bold-word pattern
// used by the detail row list (see detail-row-list.tsx). Most fields get a
// plain, literal icon — a briefcase reads as "work" instantly, and forcing
// a horseshoe next to "Bachelor's Degree" would just look confused. The
// western icons are saved for fields where they genuinely fit: hometown
// (a Texas star), Austin status (a cactus), pets (a horseshoe — "Horse" is
// one of the options), and relationship type (the lasso heart).
export const DETAIL_ICONS: Record<DetailKey, ComponentType<{ className?: string }>> = {
  age: CalendarIcon,
  height: RulerIcon,
  work: BriefcaseIcon,
  education: BookIcon,
  faith: SparkleIcon,
  ethnicity: GlobeIcon,
  relationshipType: LassoHeartIcon,
  children: BabyIcon,
  familyPlans: HouseIcon,
  hometown: WesternStarIcon,
  austinStatus: CactusIcon,
  pets: HorseshoeIcon,
  languages: ChatIcon,
  politics: FlagIcon,
  drinking: CupIcon,
  smoking: SmokeIcon,
  marijuana: LeafIcon,
  drugs: InfoCircleIcon,
};
