import Link from "next/link";

// Single-screen mobile landing. Everything above the fold, one action.
//
// The width cap lives on this element rather than on an outer wrapper with its
// own background colour. At 448px it is narrower than any modern phone, so on a
// real device the page runs edge to edge with no cream bars down the sides. On
// desktop the same cap reads as a phone frame instead of a stretched web page.
//
// Legal links are deliberately not repeated in the sticky bar: the global
// SiteFooter in the root layout already carries Terms, Privacy, Community
// Guidelines, Acceptable Use, Safety and Contact, which is the set Stripe and
// App Store review actually check for.

export default function LandingPage() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-between border-x border-amber-900/10 bg-[#FFFDF9] font-sans text-[#2C1810] shadow-2xl">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-5 py-3.5 backdrop-blur-md">
        <span className="font-display text-[1.4rem] font-bold tracking-tight text-[#D92B4B]">SaddleMatch</span>
        <Link
          href="/login"
          className="rounded-full border border-[#D92B4B]/20 px-3 py-1.5 text-sm font-semibold text-[#D92B4B] transition-opacity hover:opacity-80"
        >
          Log in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-6 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#D92B4B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D92B4B]">
          <span aria-hidden="true">☆</span> Dating for the western lifestyle{" "}
          <span aria-hidden="true">☆</span>
        </div>

        <h1 className="mb-3 font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-[#1A0C08]">
          Built for{" "}
            <span className="italic text-[#D92B4B]">Austin&rsquo;s</span>{" "}
            Country Lifestyle
        </h1>
        <p className="mb-7 max-w-[19rem] text-base leading-relaxed text-stone-600">
          Meet local singles who love two-stepping, live country music, rodeos,
          and real Texas connections.
        </p>

        <div className="relative mb-4 w-full overflow-hidden rounded-2xl border border-amber-900/10 bg-white p-4 text-left shadow-xl">
          <div className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
            Today&rsquo;s match
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-xl font-bold text-stone-500">
              <span aria-hidden="true">🤠</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Austin, TX</h2>
              <p className="text-xs text-stone-500">Two-stepper &middot; Live music fan</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["Broken Spoke", "Two-step intermediate", "Country gold"].map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-stone-100 px-2.5 py-1 font-medium text-stone-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold italic text-stone-500">
          One thoughtful match every day. No endless swiping.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-amber-900/10 bg-white/95 p-4 backdrop-blur-md">
        <Link
          href="/signup"
          className="block w-full rounded-xl bg-[#D92B4B] px-6 py-3.5 text-center text-base font-bold text-white shadow-lg shadow-[#D92B4B]/25 transition-all hover:bg-[#C0223F] active:scale-[0.98]"
        >
          Create My Free Profile
        </Link>
      </div>
    </div>
  );
}
