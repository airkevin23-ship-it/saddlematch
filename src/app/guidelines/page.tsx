import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Community Guidelines — ${APP_NAME}`,
  description:
    "How to be a good member of SaddleMatch: showing up honestly, treating people well, meeting safely, and looking out for each other.",
};

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2 tracking-tight">Community Guidelines</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <p className="text-ink-soft mb-3">
              Our <Link href="/acceptable-use" className="underline">Acceptable Use Policy</Link> covers
              the rules and what happens if you break them. This page is the other half: what it
              actually looks like to be a good member here.
            </p>
            <p className="text-ink-soft mb-3">
              {APP_NAME} is small and it is local. Right now that means Austin. You are likely to
              run into the people you meet here at a dance hall, a coffee shop, or a friend&rsquo;s
              party. That is a feature, and it is worth behaving accordingly.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Show up as yourself</h2>
            <p className="text-ink-soft mb-3">Use recent photos that look like you today, not you five years and one haircut ago. Meeting someone who does not match their pictures is the most common complaint in online dating, and it is an easy one to avoid.</p>
            <p className="text-ink-soft mb-3">Write your own prompt answers. If you use the AI writing help, treat it as a starting point and make it sound like you — the point is for someone to recognise you when you show up.</p>
            <p className="text-ink-soft mb-3">Be honest about what you are looking for. Wanting something casual is fine. Wanting something serious is fine. Pretending to want the other one to keep someone interested is not.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Lead with something real</h2>
            <p className="text-ink-soft mb-3">The prompts exist so you have something to talk about. A first message that responds to something specific on someone&rsquo;s profile will nearly always land better than &ldquo;hey.&rdquo;</p>
            <p className="text-ink-soft mb-3">You do not owe anyone a long reply, but if you matched with someone, a short honest message beats silence.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Take a no gracefully</h2>
            <p className="text-ink-soft mb-3">Not everyone will be interested, and that is not a referendum on you. If someone unmatches, stops replying, or asks you to stop contacting them, that is the end of it.</p>
            <p className="text-ink-soft mb-3">Do not argue, do not ask why, and do not come back through a new account. How you handle rejection says more about you than anything on your profile.</p>
            <p className="text-ink-soft mb-3">The same applies in the other direction: it is completely fine to unmatch someone without an explanation.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Meet safely</h2>
            <p className="text-ink-soft mb-3">Meet somewhere public the first time, and get there and home under your own steam. A busy bar, a coffee shop, a restaurant — anywhere with other people around.</p>
            <p className="text-ink-soft mb-3">Tell a friend where you are going and who with. Share the profile if you want to.</p>
            <p className="text-ink-soft mb-3">Keep your first meeting to a drink or a coffee. It is easier to leave early if it is not working, and easier to extend if it is.</p>
            <p className="text-ink-soft mb-3">Trust your gut. If something feels off before or during a meeting, you are allowed to leave. You do not need a reason and you do not owe an explanation.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Protect your own information</h2>
            <p className="text-ink-soft mb-3">You do not need to share your last name, your address, your workplace, or your financial details to get to know someone. Move at your own pace on that.</p>
            <p className="text-ink-soft mb-3">Be wary of anyone who wants to move off {APP_NAME} to another app immediately, or who has a reason they cannot video chat or meet.</p>
            <p className="text-ink-soft mb-3"><strong>Never send money.</strong> Not to someone you have not met, and not to someone you have. If a conversation turns toward money, investments, crypto, or an emergency that only you can solve, it is a scam. Report it and we will act on the account.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Look out for each other</h2>
            <p className="text-ink-soft mb-3">Every profile and conversation has report and block tools, and we read every report. Reporting is confidential — the person will not be told who reported them.</p>
            <p className="text-ink-soft mb-3">Report the things you would want someone to report for you: fake profiles, harassment, anyone asking for money, anyone who seems underage, anyone making you feel unsafe.</p>
            <p className="text-ink-soft mb-3">Blocking removes someone from your Discover queue and stops them contacting you. You can do it at any time, for any reason, and you do not have to explain it.</p>
            <p className="text-ink-soft mb-3">If someone is in immediate danger, call emergency services first. Then tell us.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">A note on being early</h2>
            <p className="text-ink-soft mb-3">{APP_NAME} is new, and in a new city the number of profiles is smaller than what you are used to on the big apps. That is the trade — fewer people, but people actually near you who are actually looking.</p>
            <p className="text-ink-soft mb-3">If you are here early, you are shaping what this becomes. The tone of a small community is set by the first few hundred members, and we would rather it be the kind of place where people are straightforward and kind. That mostly comes down to how you treat the next person you match with.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
