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
