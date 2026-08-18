"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

// Every legal page we publish has to actually be reachable. Stripe and the App
// Store both check that these are linked, not just that the URLs resolve, so this
// footer is the single place they live, along with a working contact address.

const LINKS = [
  { href: "/company", label: "Company" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/guidelines", label: "Community Guidelines" },
  { href: "/acceptable-use", label: "Acceptable Use Policy" },
  { href: "/safety", label: "Safety Policy" },
  { href: "mailto:contact@wwllcs.com", label: "Contact" },
];

export default function SiteFooter({ inApp = false }: { inApp?: boolean }) {
  const pathname = usePathname();

  // Inside the signed-in app the tab bar is the bottom of the screen, and a
  // web-style footer stacked above it is wrong twice over: it renders at full
  // body width while the app itself is capped to a phone column, so the links
  // spill out either side, and it collides with the fixed Save bar on the
  // profile editor. Policies stay reachable from Settings instead, which is
  // where an app is expected to keep them.
  if (pathname?.startsWith("/app")) return null;

  return (
    <footer
      className={`border-t border-line bg-cream px-6 py-8 text-center ${
        inApp ? "pb-28" : "pb-10"
      }`}
    >
      <nav aria-label="Legal and policies" className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-xs font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-5 text-xs text-ink-faint">
        {APP_NAME} is for adults 18 and over. A W&amp;W Trading LLC company.
        <br className="hidden sm:inline" />
        &copy; {new Date().getFullYear()} W&amp;W Trading LLC. {APP_NAME} is a trademark of W&amp;W Trading LLC.
      </p>
    </footer>
  );
}
