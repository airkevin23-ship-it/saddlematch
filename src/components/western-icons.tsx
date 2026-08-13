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
      <path d="M3 16.5c0-1 1.4-1.7 2.7-2.1C7 14 8 12.7 8 11.2c0-3 2-5.7 4-5.7s4 2.7 4 5.7c0 1.5 1 2.8 2.3 3.2 1.3.4 2.7 1.1 2.7 2.1 0 1.4-4.3 2.5-9 2.5s-9-1.1-9-2.5Z" />
      <path d="M6.5 16c1.4.5 3.4.8 5.5.8s4.1-.3 5.5-.8" />
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
