import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

// Every legal page we publish has to actually be reachable. Stripe and the App
// Store both check that these are linked, not just that the URLs resolve, so this
// footer is the single place they live, along with a working contact address.

const LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/guidelines", label: "Community Guidelines" },
  { href: "/acceptable-use", label: "Acceptable Use Policy" },
  { href: "/safety", label: "Safety" },
  { href: "mailto:kswwllc@gmail.com", label: "Contact" },
];

export default function SiteFooter({ inApp = false }: { inApp?: boolean }) {
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
        {APP_NAME} is for adults 18 and over. &copy; {new Date().getFullYear()} {APP_NAME}.
      </p>
    </footer>
  );
}
