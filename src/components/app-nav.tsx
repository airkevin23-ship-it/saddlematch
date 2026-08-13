"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WesternStarIcon } from "@/components/western-icons";

// Persistent app chrome: the same top bar and bottom tab bar on every screen,
// at every width. SaddleMatch is a phone app, so the tab bar is never hidden
// behind a desktop breakpoint — it spans the full width of the app shell
// and centres itself on the shell's own max-width instead of a separate 480px
// column. That mismatch is what put cream bars down the sides on a real phone.
//
// The thing that makes a tab bar feel like an app rather than a list of links
// is the current-page indicator. Without it you can tap a tab and not be sure
// anything happened. So every tab here reports active state off the pathname,
// which is also why this file is a client component.
//
// Preferences and Settings live in the header instead of at the bottom of the
// profile page, so they are reachable from anywhere in one tap.

interface IconProps {
  className?: string;
}

function CardsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="12" height="16" rx="2.5" />
      <path d="M17.5 6.5A2.5 2.5 0 0 1 20 9v7a4 4 0 0 1-4 4h-4" />
    </svg>
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.8-5.1A7.5 7.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.8c0 5.6-7.5 10-7.5 10Z" />
    </svg>
  );
}

function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="10" cy="17" r="2.2" />
    </svg>
  );
}

function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7" />
    </svg>
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

/** Preferences + Settings, pinned to the header on every screen. */
export function HeaderActions() {
  const isActive = useIsActive();
  const items = [
    { href: "/app/preferences", label: "Dating preferences", Icon: SlidersIcon },
    { href: "/app/settings", label: "Settings", Icon: GearIcon },
  ];
  return (
    <>
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={isActive(href) ? "page" : undefined}
          className={`grid min-h-11 min-w-11 place-items-center rounded-xl transition-colors ${
            isActive(href) ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-cream hover:text-ink"
          }`}
        >
          <Icon className="h-6 w-6" />
        </Link>
      ))}
    </>
  );
}

const TABS = [
  { href: "/app/discover", label: "Discover", Icon: CardsIcon },
  { href: "/app/likes", label: "Likes", Icon: HeartIcon },
  { href: "/app/matches", label: "Matches", Icon: ChatIcon },
  { href: "/app/upgrade", label: "Plus", Icon: WesternStarIcon },
];

/**
 * Bottom tab bar. `matchBadge` renders the unread pill — it stays hidden until
 * there is real read state to count, since `messages` has no read_at column
 * yet. Wiring it later is a one-prop change rather than a redesign.
 */
export function BottomNav({
  avatarUrl,
  matchBadge = 0,
  likesBadge = 0,
}: {
  avatarUrl?: string | null;
  matchBadge?: number;
  likesBadge?: number;
}) {
  const isActive = useIsActive();
  const profileActive = isActive("/app/profile");

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-5 border-t border-line bg-card/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur shadow-[0_-8px_24px_rgba(27,25,23,0.06)]"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
              active ? "text-brand" : "text-ink-faint hover:text-ink"
            }`}
          >
            <span className="relative">
              <Icon className="h-6 w-6" />
              {href === "/app/matches" && matchBadge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white">
                  {matchBadge > 9 ? "9+" : matchBadge}
                </span>
              )}
              {href === "/app/likes" && likesBadge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white">
                  {likesBadge > 9 ? "9+" : likesBadge}
                </span>
              )}
            </span>
            <span className={`text-[11px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
          </Link>
        );
      })}

      <Link
        href="/app/profile"
        aria-current={profileActive ? "page" : undefined}
        className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
          profileActive ? "text-brand" : "text-ink-faint hover:text-ink"
        }`}
      >
        <span
          className={`grid h-6 w-6 place-items-center overflow-hidden rounded-full ring-2 ${
            profileActive ? "ring-brand" : "ring-transparent"
          }`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-line text-[10px] font-bold text-ink-soft">
              {"•"}
            </span>
          )}
        </span>
        <span className={`text-[11px] ${profileActive ? "font-bold" : "font-semibold"}`}>Profile</span>
      </Link>
    </nav>
  );
}
