import Image from "next/image";
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
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col border-x border-amber-900/10 bg-[#FFFDF9] font-sans text-[#2C1810] shadow-2xl">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-5 py-3.5 backdrop-blur-md">
        <Image
            src="/saddlematch-wordmark.png"
            alt="SaddleMatch"
            width={376}
            height={42}
            priority
            className="h-5 w-auto"
          />
        <Link
          href="/login"
          className="rounded-full border border-[#D92B4B]/20 px-3 py-1.5 text-sm font-semibold text-[#D92B4B] transition-opacity hover:opacity-80"
        >
          Log in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pb-36 pt-10 text-center">
        <div className="mb-4 max-w-[15.5rem] rounded-full bg-[#D92B4B]/10 px-4 py-1.5 text-center text-xs font-semibold uppercase leading-snug tracking-widest text-[#D92B4B]">
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

        {/* Sample profile is fictional. Labelled so it cannot read as a claim
            about who is already on the app. */}
        <p className="mb-4 text-[11px] font-medium text-stone-400">
          Sample profile &mdash; what a daily match looks like.
        </p>

        {/* How it works. One match a day is unfamiliar mechanics and it is the
            whole product, so this section gets the most room on the page. */}
        <section className="mt-10 w-full text-left">
          <h2 className="mb-4 text-center font-display text-2xl font-bold text-[#1A0C08]">
            How SaddleMatch works
          </h2>
          <ol className="space-y-3">
            {[
              {
                title: "Build a profile worth reading",
                body: "Answer three prompts instead of staring at an empty bio. Add photos, a short video, and your voice if you want to.",
              },
              {
                title: "Meet one person a day",
                body: "Every morning, one match \u2014 chosen for shared interests and the parts of Austin you actually spend time in.",
              },
              {
                title: "Start with something real",
                body: "Like a specific answer, not just a face. What you say about it becomes your first message.",
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D92B4B] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Trust. Every line here is a promise the product actually keeps:
            profiles auto-quarantine into /admin/moderation, age is validated at
            onboarding, and settings exposes pause + hide. If any of those stop
            being true, the matching line has to come off this page. */}
        <section className="mt-10 w-full text-left">
          <h2 className="mb-4 text-center font-display text-2xl font-bold text-[#1A0C08]">
            Built to feel safe
          </h2>
          <ul className="space-y-2">
            {[
              ["18+ only", "Every profile is reviewed before it appears."],
              ["Block and report on every profile", "One tap, no explanation needed."],
              ["You control what is visible", "Hide or pause your profile any time."],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-2.5 rounded-xl bg-white/70 px-3.5 py-3">
                <span aria-hidden="true" className="font-bold text-[#D92B4B]">
                  &#10003;
                </span>
                <p className="text-sm leading-snug text-stone-700">
                  <span className="font-semibold text-stone-900">{title}.</span> {body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Founding member. Deliberately no member counts and no testimonials:
            there are no members yet, and inventing them is not recoverable. */}
        <section className="mt-10 w-full rounded-2xl border border-[#D92B4B]/15 bg-[#D92B4B]/5 p-5 text-left">
          <h2 className="font-display text-xl font-bold text-[#1A0C08]">Austin first</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            SaddleMatch is opening in Austin before anywhere else. Join now and
            you&rsquo;re a founding member &mdash; you help set the tone of
            who&rsquo;s here before anyone else arrives.
          </p>
        </section>

        {/* The sticky bar stays pinned for the whole scroll; this is the close
            for someone who read all the way down. */}
        <Link
          href="/signup"
          className="mt-8 block w-full rounded-xl bg-[#D92B4B] px-6 py-3.5 text-center text-base font-bold text-white shadow-lg shadow-[#D92B4B]/25 transition-all hover:bg-[#C0223F] active:scale-[0.98]"
        >
          Create My Free Profile
        </Link>
        <p className="mt-2 text-xs text-stone-500">Free to join. 18+.</p>

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
