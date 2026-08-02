import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CactusIcon,
  CowboyHatIcon,
  HorseshoeIcon,
  WesternStarIcon,
} from "@/components/western-icons";
import {
  APP_NAME,
  CITIES,
  PLUS_FEATURES,
  SUBSCRIPTION_INTRO_PERIOD,
  SUBSCRIPTION_INTRO_PRICE_LABEL,
  SUBSCRIPTION_PRICE_LABEL,
  TAGLINE,
} from "@/lib/constants";

const TRUST_ITEMS = [
  { icon: "🔞", label: "18+ community" },
  { icon: "🚫", label: "Block & report tools" },
  { icon: "🔒", label: "Private profile controls" },
  { icon: "📍", label: "Built for real local connections" },
];

export default async function LandingPage() {
  // A city is only described as open when the database explicitly marks it
  // open. That prevents a new visitor from expecting an active local dating
  // pool before the community has actually launched there.
  const INTEREST_TAGS = [
  "Two-stepping",
  "Hiking",
  "Kayaking",
  "Live music",
  "Rodeos",
  "Trail rides",
];

const DATE_SPOT_SHOWDOWNS = [
  {
    title: "Two-step face-off",
    a: "White Horse",
    b: "Sagebrush",
    note: "Both have a live band most nights, so pick whichever crowd looks more fun when you walk in.",
  },
  {
    title: "Trail date",
    a: "Lady Bird Lake Hike-and-Bike Trail",
    b: "Barton Creek Greenbelt",
    note: "Flat and social vs. shaded and a little wild. Either way, wear real shoes.",
  },
  {
    title: "Paddle date",
    a: "Rowing Dock kayaks",
    b: "Congress bridge bat watch",
    note: "Paddle out at sunset for the bats - it is touristy and it works every time.",
  },
];

export default async function LandingPage() {
let openCityIds = new Set<number>();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("cities").select("id, is_open");
    if (data) {
      openCityIds = new Set(data.filter((c) => c.is_open).map((c) => c.id));
    }
  } catch {
    // Fall back to "all open" — see comment above.
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          aria-label="SaddleMatch home"
          className="flex min-h-11 items-center gap-1.5 rounded-lg font-extrabold text-lg sm:text-xl tracking-tight focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <HorseshoeIcon className="w-5 h-5 text-brand" />
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-medium">
          <Link href="/login" className="text-ink-soft hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-ink text-cream px-4 sm:px-5 py-2.5 rounded-full font-semibold hover:bg-brand transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-10 sm:py-16">
        <p className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest text-brand font-bold mb-4">
          <WesternStarIcon className="w-4 h-4" />
          {TAGLINE}
          <WesternStarIcon className="w-4 h-4" />
        </p>
        <h1 className="text-3xl sm:text-6xl font-extrabold max-w-3xl leading-[1.08] tracking-tight">
          Join Austin&rsquo;s Newest <br className="hidden sm:block" />
          Country Dating Community
        </h1>
        <p className="mt-5 sm:mt-6 max-w-xl text-ink-soft text-base sm:text-lg leading-relaxed">
          {APP_NAME} is a dating app built for people who love country music,
          two-stepping, and real Texas connection — starting right here in
          Austin. Prompt-based profiles instead of a blank bio, a small
          curated batch of matches each day instead of endless swiping, and
          AI to help you write better and break the ice.
        </p>

        <div className="mt-7 grid w-full max-w-sm grid-cols-1 gap-3 sm:max-w-none sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/signup"
            className="bg-brand hover:bg-brand-dark text-white px-7 py-3.5 rounded-full font-bold shadow-lg shadow-brand/25 transition-colors min-h-12"
          >
            Claim Your Space in Austin Now
          </Link>
          <Link
            href="#pricing"
            className="border-2 border-ink/15 hover:border-ink/40 px-7 py-3.5 rounded-full font-bold transition-colors min-h-12"
          >
            See pricing
          </Link>
        </div>

        {/* Hero photo — real Austin dance hall, sets the scene before anything else */}
        <div className="mt-10 w-full max-w-3xl overflow-hidden rounded-3xl shadow-xl shadow-black/[0.08]">
          <img
            src="/austin-dance-hall.jpg"
            alt="Couples two-stepping on the dance floor at an Austin honky-tonk"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Safety / trust row — dating users look for this before anything else */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-2xl">
          <CactusIcon className="w-4 h-4 text-ink-faint" aria-hidden="true" />
          {TRUST_ITEMS.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        {/* Product preview — show, don't just tell */}
        <div className="mt-14 w-full max-w-4xl">
          <p className="text-xs uppercase tracking-widest font-bold text-ink-faint mb-6">
            What using it feels like
          </p>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Mockup 1 — a profile built on prompts */}
            <div className="text-left">
              <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06] overflow-hidden max-w-[320px] mx-auto sm:max-w-[280px] sm:mx-0">
                <div className="aspect-[4/5] bg-line overflow-hidden">
                  <img
                    src="/maddie-profile.png"
                    alt="Maddie enjoying an Austin evening"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="p-4">
                  <p className="font-extrabold text-sm">Maddie, 27</p>
                  <p className="text-xs text-ink-soft mb-3">Austin</p>
                  <div className="rounded-xl border border-line bg-cream p-3">
                    <p className="text-[11px] text-ink-soft font-medium">
                      Best local spot for a first date…
                    </p>
                    <p className="text-xs mt-1">Nickel City, for pool and good queso.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm font-bold mt-4">Answer prompts, not a blank box</p>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                3 specific prompts instead of a bio you stare at forever.
              </p>
            </div>

            {/* Mockup 2 — daily curated picks */}
            <div className="text-left">
              <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06] p-4 max-w-[320px] mx-auto sm:max-w-[280px] sm:mx-0">
                <p className="text-[11px] text-ink-soft text-center font-medium tracking-wide uppercase mb-3">
                  8 of 8 in today&rsquo;s roundup
                </p>
                <div className="space-y-2">
                  {[
                    { name: "Jordan, 29", city: "Houston", image: "/jordan-profile.png" },
                    { name: "Casey, 26", city: "Dallas", image: "/casey-profile.png" },
                    { name: "Priya, 28", city: "San Antonio", image: "/maddie-profile.png" },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2"
                    >
                      <img
                        src={p.image}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{p.name}</p>
                        <p className="text-[10px] text-ink-soft leading-tight">{p.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm font-bold mt-4">Today&rsquo;s roundup, once a day</p>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Curated daily matches, not an infinite deck to burn through.
              </p>
            </div>

            {/* Mockup 3 — like a specific answer, becomes the opener */}
            <div className="text-left">
              <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06] p-4 max-w-[320px] mx-auto sm:max-w-[280px] sm:mx-0">
                <div className="rounded-xl border border-line bg-cream p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-ink-soft font-medium">
                        Two truths and a lie…
                      </p>
                      <p className="text-xs mt-1">
                        I&rsquo;ve met 3 astronauts. I hate queso. I once won a chili
                        cook-off.
                      </p>
                    </div>
                    <span className="text-brand text-base shrink-0">♥</span>
                  </div>
                  <div className="mt-2 rounded-lg bg-card border border-line px-2.5 py-1.5 text-[11px] text-ink-soft">
                    queso hate is a dealbreaker for me lol
                  </div>
                </div>
                <div className="mt-2 w-full bg-brand text-white text-center text-xs font-bold py-2 rounded-lg">
                  Send like
                </div>
              </div>
              <p className="text-sm font-bold mt-4">Like a specific answer</p>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Comment on what you liked — it becomes your opening message.
              </p>
            </div>
          </div>

          <Link
            href="/safety"
            className="mt-4 text-xs font-semibold text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
          >
            How SaddleMatch safety works
          </Link>
        </div>

        {/* Interest tags — personalizes the pitch beyond "just a dating app" */}
        <div className="mt-14 sm:mt-16 w-full max-w-2xl">
          <p className="text-xs uppercase tracking-widest font-bold text-ink-faint mb-4 text-center">
            Tell us what you&rsquo;re into
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {INTEREST_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft text-center max-w-md mx-auto">
            Add these — and more — to your profile so matches know what you actually want to do on a Saturday.
          </p>
        </div>

        {/* Date Spot Showdowns — local flavor, static content, no voting mechanic */}
        <div className="mt-14 sm:mt-16 w-full max-w-4xl">
          <p className="text-xs uppercase tracking-widest font-bold text-ink-faint mb-2 text-center">
            Austin date spot showdowns
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-8">
            No wrong answer. Just go.
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {DATE_SPOT_SHOWDOWNS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-line bg-card p-5 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-brand mb-2">{s.title}</p>
                <p className="text-sm font-bold">
                  {s.a} <span className="text-ink-faint font-normal">vs.</span> {s.b}
                </p>
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 sm:mt-16 w-full max-w-2xl">
          <p className="text-xs uppercase tracking-widest font-bold text-ink-faint mb-4">
            New in these cities — be one of the first
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CITIES.map((city) => {
              const isOpen = openCityIds.has(city.id);
              return (
                <Link
                  key={city.slug}
                  href={isOpen ? "/signup" : `/waitlist?city=${city.slug}`}
                  className="rounded-2xl border border-line bg-card shadow-sm shadow-black/[0.03] py-6 block hover:border-line-strong transition-colors"
                >
                  <p className="font-bold">{city.name}</p>
                  <p className="text-[10px] text-brand font-bold uppercase tracking-wide mt-1">
                    {isOpen ? "Just launched" : "Join waitlist"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 sm:px-6 py-14 sm:py-20 border-t border-line">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold mb-2 tracking-tight">Free to match. Paid to get help.</h2>
          <p className="text-ink-soft mb-2">
            Browsing, swiping, and matching are always free.
          </p>
          <p className="text-ink-soft mb-8 max-w-lg mx-auto">
            AI helps you write a stronger profile, understand what you have in
            common, and start better conversations. You stay in control of every
            decision and message.
          </p>
          <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.04] p-6 sm:p-8 w-full sm:w-auto">
            <p className="flex items-center justify-center gap-1.5 font-extrabold text-lg mb-1">
              <WesternStarIcon className="w-4 h-4 text-brand" />
              {APP_NAME} Plus
            </p>
            <p className="text-4xl font-extrabold text-brand">{SUBSCRIPTION_INTRO_PRICE_LABEL}</p>
            <p className="text-ink-soft mt-1 text-sm">
              {SUBSCRIPTION_INTRO_PERIOD}, then {SUBSCRIPTION_PRICE_LABEL}. Cancel anytime.
            </p>
            <ul className="text-left mt-6 space-y-2 text-sm text-ink">
              {PLUS_FEATURES.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14 sm:py-20 border-t border-line bg-card">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-bold text-brand text-center mb-3">
            Good to know
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-center mb-10">
            SaddleMatch FAQ
          </h2>
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-cream p-5">
              <h3 className="font-bold">Is SaddleMatch free?</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                Yes. Creating a profile, seeing daily matches, liking profiles, and matching are free. Plus adds optional AI help and extra features.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-cream p-5">
              <h3 className="font-bold">Where is SaddleMatch available?</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                We are building one Texas city at a time. Join the waitlist for your city and we will let you know when the local community opens.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-cream p-5">
              <h3 className="font-bold">Does AI write or send messages for me?</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                No. AI can offer a profile idea, a conversation starter, or a shared-interest note. You choose what to use, and SaddleMatch never sends a message or makes a dating decision for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-6 py-8 text-center text-sm text-ink-faint border-t border-line space-x-3 leading-8">
        <span className="inline-flex items-center gap-1.5">
          <HorseshoeIcon className="w-3.5 h-3.5" />
          {APP_NAME} — Houston · Austin · Dallas · San Antonio
        </span>
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
