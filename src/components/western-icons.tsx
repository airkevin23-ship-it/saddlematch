// Small hand-drawn line-art icons for the western/country-lifestyle theme.
// Single-color, currentColor-based so they inherit text color via Tailwind
// classes (e.g. `text-brand`, `text-ink-faint`). Kept simple and crisp at
// icon sizes (16–28px) rather than photorealistic.

interface IconProps {
  className?: string;
}

export function HorseshoeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 13.5V9a5 5 0 0 1 10 0v4.5" />
      <path d="M7 13.5c-1.7.5-3 1.8-3 3.5 0 .6.5 1 1 .8l3.3-1.4" />
      <path d="M17 13.5c1.7.5 3 1.8 3 3.5 0 .6-.5 1-1 .8l-3.3-1.4" />
      <circle cx="6" cy="9.3" r=".6" fill="currentColor" stroke="none" />
      <circle cx="6.6" cy="11.6" r=".6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="9.3" r=".6" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="11.6" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WesternStarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.5 14.4 9h6.8l-5.5 4.2L17.8 20 12 15.9 6.2 20l2.1-6.8L2.8 9h6.8Z" />
    </svg>
  );
}

export function CowboyHatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Wide flat brim, clearly wider than the crown, so this reads as a hat
          at a glance rather than any other rounded silhouette — the previous
          version was a smooth dome sitting directly on a tight ring and read
          badly at larger sizes. */}
      <path d="M2.5 16C2.5 14.3 5 13.3 8 13.1L8 13C8 9.5 9.8 6.5 12 6.5C14.2 6.5 16 9.5 16 13L16 13.1C19 13.3 21.5 14.3 21.5 16C21.5 17.4 17.2 18.5 12 18.5C6.8 18.5 2.5 17.4 2.5 16Z" />
      <path d="M8.3 12.8L15.7 12.8" />
    </svg>
  );
}

// A heart looped from a single rope, with a small lasso-knot flourish —
// used as the hero illustration on empty states (e.g. Likes You) instead
// of a stock photo/illustration, so it stays on-brand and license-free.
export function LassoHeartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20.3s-7.8-4.6-7.8-10.4A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.8 2.8c0 5.8-7.8 10.4-7.8 10.4Z" />
      <path d="M15.6 4.6c1.6-.6 3.3.2 3.7 1.8.3 1.1-.2 2.2-1.2 2.8" />
      <circle cx="19.6" cy="5.8" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CactusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21V9a2.5 2.5 0 0 1 2.5-2.5H16" />
      <path d="M16 13.5V9A2.5 2.5 0 0 0 13.5 6.5" />
      <path d="M12 13H9.5A2.5 2.5 0 0 1 7 10.5V7" />
      <path d="M7 11.5V7A2.5 2.5 0 0 1 9.5 4.5" />
      <path d="M9 21h6" />
    </svg>
  );
}

// ---------------------------------------------------------------------
// Detail-row icons
// ---------------------------------------------------------------------
// A small line-icon set for the "About me"-style detail rows on the
// profile view and Discover card (see detail-icons.tsx), matching the
// icon-plus-bold-word pattern used by reference apps like Krush. Same
// 24x24 grid and stroke weight as the western icons above so the two
// sets sit together without looking like they came from different
// libraries. Kept generic/literal where a western motif would be a
// stretch (a briefcase reads as "work" instantly; a cowboy boot does
// not) — the western flourishes above are reserved for fields where
// they actually fit (hometown, Austin status, pets, relationship type).

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function RulerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="8.5" width="17" height="7" rx="1.5" transform="rotate(-32 12 12)" />
      <path d="M9.7 10.8 8.4 9.5M12.4 9.6l-1.3-1.3M15.1 8.4 13.8 7.1" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="7.5" width="18" height="12" rx="2.2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4.8c2.3-.7 5-.5 8 1v13.4c-3-1.5-5.7-1.7-8-1Z" />
      <path d="M20 4.8c-2.3-.7-5-.5-8 1v13.4c3-1.5 5.7-1.7 8-1Z" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.5c.5 3 1.9 4.4 4.9 4.9-3 .5-4.4 1.9-4.9 4.9-.5-3-1.9-4.4-4.9-4.9 3-.5 4.4-1.9 4.9-4.9Z" />
      <path d="M18.3 14.5c.3 1.6 1 2.3 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.3 2.3-1 2.6-2.6Z" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.2-3.4-8.5S9.8 5.8 12 3.5Z" />
    </svg>
  );
}

export function BabyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4.5" />
      <path d="M8.3 9.5c.9.8 2 1.2 3.7 1.2s2.8-.4 3.7-1.2" />
      <path d="M6.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
    </svg>
  );
}

export function HouseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5V14h4v5.5" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4Z" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3.5v17" />
      <path d="M6 4.5c3-1.2 5 .8 8-.4v8c-3 1.2-5-.8-8 .4Z" />
    </svg>
  );
}

export function CupIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 3.5h8l-1 13a2 2 0 0 1-2 1.8h-2a2 2 0 0 1-2-1.8Z" />
      <path d="M6.5 20.5h11" />
      <path d="M10.5 20.5V18.3M13.5 20.5V18.3" />
    </svg>
  );
}

export function SmokeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 21c1-1.2 1-2.4 0-3.6-1-1.2-1-2.4 0-3.6" />
      <path d="M13.5 21c1-1.2 1-2.4 0-3.6-1-1.2-1-2.4 0-3.6" />
      <path d="M18 21c1-1.2 1-2.4 0-3.6-1-1.2-1-2.4 0-3.6" />
      <path d="M4 12.5h13a3 3 0 0 0 0-6 3 3 0 0 0-5-2" />
    </svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 19c-1-6 2-13 14-14 1 11-6 14-14 14Z" />
      <path d="M5 19c3-3.5 6-6 9.5-10" />
    </svg>
  );
}

export function InfoCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="8" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}
