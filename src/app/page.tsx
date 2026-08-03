import Link from "next/link";
import { HorseshoeIcon, WesternStarIcon } from "@/components/western-icons";
import { APP_NAME, TAGLINE } from "@/lib/constants";

// Deliberately minimal: this page has exactly one job — convince the right
// person to tap "Create My Free Profile." Everything else (pricing, FAQ,
// city list, product previews) has moved into the /welcome onboarding flow
// or lives after signup, so a first-time visitor never has to scroll or
// think about anything except that one decision.
export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink">
      <header className="px-4 sm:px-6 py-4 sm:py-5 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          aria-label="SaddleMatch home"
          className="flex w-fit min-h-11 items-center gap-1.5 rounded-lg font-extrabold text-lg sm:text-xl tracking-tight focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <HorseshoeIcon className="w-5 h-5 text-brand" />
          {APP_NAME}
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <p className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest text-brand font-bold mb-4">
          <WesternStarIcon className="w-4 h-4" />
          {TAGLINE}
          <WesternStarIcon className="w-4 h-4" />
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold max-w-2xl leading-[1.1] tracking-tight">
          Finally, a Dating App Built for Austin&rsquo;s Country Lifestyle
        </h1>
        <p className="mt-5 max-w-sm text-ink-soft text-base leading-relaxed">
          Meet people who love two-stepping, live music, rodeos, and real
          Texas connections.
        </p>
        <p className="mt-2 max-w-sm text-ink text-base font-bold leading-relaxed">
          One thoughtful match every day. No endless swiping.
        </p>

        <Link
          href="/welcome"
          className="mt-8 inline-flex items-center justify-center bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-brand/25 transition-colors min-h-12 w-full max-w-xs"
        >
          Create My Free Profile
        </Link>

        <p className="mt-5 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:text-brand-dark font-semibold">
            Log in
          </Link>
        </p>
      </section>

      <footer className="px-4 sm:px-6 py-6 text-center text-xs text-ink-faint border-t border-line space-x-3">
        <Link href="/terms" className="hover:text-ink-soft underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-ink-soft underline">
          Privacy
        </Link>
        <Link href="/safety" className="hover:text-ink-soft underline">
          Safety
        </Link>
      </footer>
    </main>
  );
}
