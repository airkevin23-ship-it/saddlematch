import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Acceptable Use Policy — ${APP_NAME}`,
  description:
    "What is and is not allowed on SaddleMatch: prohibited content, prohibited conduct, commercial activity rules, and how we enforce them.",
};

export default function AcceptableUsePage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2 tracking-tight">Acceptable Use Policy</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <p className="text-ink-soft mb-3">
              This policy explains what is and is not allowed on {APP_NAME}. It applies to
              everything you do here — your profile, your photos, your prompt answers, your
              messages, and how you treat other members. It sits alongside our{" "}
              <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
            <p className="text-ink-soft mb-3">
              Breaking these rules can cost you your account. Some violations end it
              immediately and permanently, with no refund and no second chance.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">1. You must be 18 or older</h2>
            <p className="text-ink-soft mb-3">You must be at least 18 to create an account or use {APP_NAME} in any way. There are no exceptions and no supervised or shared accounts.</p>
            <p className="text-ink-soft mb-3">Your profile must be you. Not a friend, not a business, not a character, not someone you found online. One person, one account.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">2. Zero tolerance: anything involving minors</h2>
            <p className="text-ink-soft mb-3">Do not upload, send, request, or describe sexual content involving anyone under 18. Do not use {APP_NAME} to contact, groom, or solicit a minor. Do not post photos of children in a sexualised context.</p>
            <p className="text-ink-soft mb-3">This is the one rule with no warning and no appeal. Accounts are removed permanently, content is preserved as required by law, and reports are referred to the National Center for Missing &amp; Exploited Children and to law enforcement.</p>
            <p className="text-ink-soft mb-3">If you believe a minor is using {APP_NAME} or is being contacted through it, report it immediately.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">3. Photos</h2>
            <p className="text-ink-soft mb-3">Photos must show you, be reasonably recent, and not be misleading about your appearance.</p>
            <p className="text-ink-soft mb-3">No nudity or sexually explicit imagery, including in profile photos and in messages. No photos of other people used as your own. No photos of someone else — including an ex, a friend, or a stranger — posted without their consent. No screenshots of another member&rsquo;s profile or private messages shared anywhere.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">4. Content you may not post</h2>
            <p className="text-ink-soft mb-3">Hate speech or slurs targeting race, ethnicity, national origin, religion, disability, sex, gender identity, or sexual orientation. Threats of violence. Content promoting or glorifying self-harm, suicide, or eating disorders. Content promoting terrorism or organised violence.</p>
            <p className="text-ink-soft mb-3">Someone else&rsquo;s private information — home address, workplace, phone number, financial details — whether they are a member here or not.</p>
            <p className="text-ink-soft mb-3">Illegal goods or services, including drugs, weapons, and stolen items.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">5. How you treat other members</h2>
            <p className="text-ink-soft mb-3">Harassment, stalking, intimidation, and unwanted sexual messages are not allowed. If someone stops replying, unmatches you, or blocks you, that is your answer. Do not create a new account to reach them again.</p>
            <p className="text-ink-soft mb-3">Do not misrepresent who you are, your age, your relationship status, or your intentions. Catfishing is grounds for removal.</p>
            <p className="text-ink-soft mb-3">Do not share, screenshot, or repost private conversations without consent.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">6. No commercial or transactional use</h2>
            <p className="text-ink-soft mb-3">{APP_NAME} is for meeting people. It is not a marketplace.</p>
            <p className="text-ink-soft mb-3">You may not offer, solicit, arrange, or advertise commercial sexual services, escorting, or any exchange of sexual activity for money, gifts, rent, travel, or other compensation. This includes arrangements described as sugaring or allowances.</p>
            <p className="text-ink-soft mb-3">You may not solicit money, loans, gift cards, cryptocurrency, or investments from other members, or direct them to paid content, cam sites, subscription platforms, or fundraising pages.</p>
            <p className="text-ink-soft mb-3">You may not use {APP_NAME} to recruit for a business, multi-level marketing scheme, religious or political organisation, or to advertise products or services of any kind.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">7. Fraud and financial exploitation</h2>
            <p className="text-ink-soft mb-3">Romance fraud is a serious crime and we treat it as one. Do not build a relationship in order to extract money, financial information, or account access from another member.</p>
            <p className="text-ink-soft mb-3">Do not impersonate anyone, use stolen photos or identity documents, or run any scheme designed to deceive members for financial gain. Confirmed fraud is reported to law enforcement and to our payment processor.</p>
            <p className="text-ink-soft mb-3">Never send money to someone you have not met in person. No genuine member will need you to.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">8. Security and technical abuse</h2>
            <p className="text-ink-soft mb-3">Do not scrape, crawl, harvest, or bulk-download profiles, photos, or member data. Do not use bots, scripts, or automated tools to create accounts, send messages, or interact with members.</p>
            <p className="text-ink-soft mb-3">Do not attempt to bypass blocks, bans, filters, or rate limits, or to access accounts, servers, or data you have no right to. Do not reverse engineer, probe, or interfere with the service or the systems it runs on.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">9. Reporting</h2>
            <p className="text-ink-soft mb-3">Every profile and conversation has report and block tools, and we review every report we receive. Blocking someone removes them from your Discover queue and stops them contacting you.</p>
            <p className="text-ink-soft mb-3">If you believe someone is in immediate danger, contact local emergency services first. Then tell us so we can act on the account.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">10. How we enforce this</h2>
            <p className="text-ink-soft mb-3">Depending on what happened and whether it has happened before, we may remove content, restrict features, suspend an account, or ban it permanently. Serious violations skip straight to a permanent ban.</p>
            <p className="text-ink-soft mb-3">A permanent ban covers the person, not just the account — creating a new account after a ban is itself a violation.</p>
            <p className="text-ink-soft mb-3">Where a paid subscription is cancelled because of a violation of this policy, it is cancelled without refund. We may preserve records and share them with law enforcement where the law requires it or where there is a credible risk to someone&rsquo;s safety.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">11. If you think we got it wrong</h2>
            <p className="text-ink-soft mb-3">We do get things wrong, and we would rather hear about it than not. If your account was restricted and you believe it was a mistake, contact us and explain what happened. We will look at it again.</p>
            <p className="text-ink-soft mb-3">The exception is section 2. Those decisions are final.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">12. Contact</h2>
            <p className="text-ink-soft mb-3">Questions about this policy, or something you need to report that the in-app tools do not cover, can be sent to us through the app or by replying to any email we send you. We would rather hear about a problem early.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
