import Link from "next/link";
import { APP_NAME, AI_FREE_PROMO_ENDS_AT } from "@/lib/constants";

const LEGAL_ENTITY = "W&W Trading LLC, Austin, Texas, USA";
const CONTACT_EMAIL = "contact@wwllcs.com";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description:
    "What SaddleMatch collects, why, who we share it with, how long we keep it, and the controls you have.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-bold text-base mb-2">1. Who is responsible for your data</h2>
            <p className="text-ink-soft mb-3">{APP_NAME} is operated by {LEGAL_ENTITY}. We decide what data is collected and why, which makes us the data controller for the information described here.</p>
            <p className="text-ink-soft mb-3">You can reach us about anything in this policy at {CONTACT_EMAIL}.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">2. What this policy covers</h2>
            <p className="text-ink-soft mb-3">This policy applies to the {APP_NAME} app and website, including your account, your profile, your messages, and the optional Plus subscription. It sits alongside our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/acceptable-use" className="underline">Acceptable Use Policy</Link>.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">3. What we collect</h2>
            <p className="text-ink-soft mb-3"><strong>Account data.</strong> Your email address and password, or your phone number if you sign up by SMS. Your date of birth, which we use to confirm you are 18 or older and to show your age.</p>
            <p className="text-ink-soft mb-3"><strong>Profile data.</strong> Display name, gender, the neighbourhoods of Austin you are open to, interests, relationship intentions, prompt answers, and photos you upload.</p>
            <p className="text-ink-soft mb-3"><strong>Preference data.</strong> Who you are interested in, dating intentions, relationship type, and the other filters you set. Some of this — particularly who you are interested in — reveals sexual orientation and is treated as sensitive. See section 10.</p>
            <p className="text-ink-soft mb-3"><strong>Activity data.</strong> Likes, passes, matches, and the messages you exchange with matches.</p>
            <p className="text-ink-soft mb-3"><strong>Payment data.</strong> If you subscribe to Plus, Stripe processes your card. We never see or store your full card number — we store only your subscription status and Stripe identifiers.</p>
            <p className="text-ink-soft mb-3"><strong>Technical data.</strong> IP address, device and browser type, and server logs generated when you use the service.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">4. Why we use it, and on what basis</h2>
            <p className="text-ink-soft mb-3"><strong>To run the service</strong> — creating your account, showing your profile to members who match your stated preferences, delivering your daily match, and carrying your messages. Basis: performance of our contract with you.</p>
            <p className="text-ink-soft mb-3"><strong>To take payment</strong> for Plus. Basis: performance of our contract with you.</p>
            <p className="text-ink-soft mb-3"><strong>To keep members safe</strong> — reviewing reports, acting on blocks, detecting fake or abusive accounts, and preventing banned members from returning. Basis: our legitimate interest, and yours, in a safe service.</p>
            <p className="text-ink-soft mb-3"><strong>To meet legal obligations</strong> — tax and accounting records, and responding to lawful requests. Basis: compliance with law.</p>
            <p className="text-ink-soft mb-3"><strong>To process sensitive data</strong> such as who you are interested in. Basis: your consent, given when you set your preferences. You can change or remove it at any time.</p>
            <p className="text-ink-soft mb-3">We do not sell your personal data, and we do not use it for third-party advertising.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">5. Who we share it with</h2>
            <p className="text-ink-soft mb-3">We use a small number of service providers. Each one only receives what it needs to do its job.</p>
            <p className="text-ink-soft mb-3"><strong>Supabase</strong> — database, authentication, and photo storage. Holds your account, profile, photos, and messages.</p>
            <p className="text-ink-soft mb-3"><strong>Vercel</strong> — application hosting. Processes requests and server logs, including IP addresses.</p>
            <p className="text-ink-soft mb-3"><strong>Stripe</strong> — payment processing for Plus. Receives your payment details directly and your email for receipts.</p>
            <p className="text-ink-soft mb-3"><strong>Twilio</strong> — SMS delivery, if you sign up or log in by phone. Receives your phone number.</p>
            <p className="text-ink-soft mb-3"><strong>Anthropic</strong> — the AI provider behind the optional Plus writing and compatibility features. See section 6, which explains exactly what is sent.</p>
            <p className="text-ink-soft mb-3">We may also disclose data to law enforcement or other authorities where we are legally required to, or where we believe in good faith that someone is at risk of serious harm.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">6. AI features and what is sent to Anthropic</h2>
            <p className="text-ink-soft mb-3">Some optional Plus features use AI: help writing a prompt answer, describing what you have in common with someone, and suggesting an opening message. As a launch promotion, these are free for every member through {AI_FREE_PROMO_ENDS_AT.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} — the data sent to Anthropic is the same either way, described below.</p>
            <p className="text-ink-soft mb-3">When you use one of these, we send the relevant profile information to Anthropic to generate a suggestion. For the compatibility feature that means the overlapping details between your profile and the other member&rsquo;s — shared interests, intentions, and city. For prompt help it means the prompt and any draft you have written.</p>
            <p className="text-ink-soft mb-3">We do not send your email address, phone number, password, payment details, or your private messages with matches.</p>
            <p className="text-ink-soft mb-3">Suggestions are shown to you and only to you. Nothing is posted to your profile or sent to another member unless you choose to send it. If you never use these features, nothing of yours is sent to Anthropic at all.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">7. What other members can see</h2>
            <p className="text-ink-soft mb-3">Other members can see your display name, age, photos, prompt answers, interests, the neighbourhoods you selected, and your stated intentions.</p>
            <p className="text-ink-soft mb-3">They cannot see your date of birth, email address, phone number, exact location, payment information, or who you have liked or passed on.</p>
            <p className="text-ink-soft mb-3">If you report someone, we may tell them that a report was made and what action followed, but we do not identify you as the reporter.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">8. How long we keep it</h2>
            <p className="text-ink-soft mb-3">While your account is open, we keep your data so the service works.</p>
            <p className="text-ink-soft mb-3">When you delete your account — which you can do yourself in Settings — your profile stops being visible immediately, and your personal data is erased within 30 days.</p>
            <p className="text-ink-soft mb-3">Some things outlive that, and we want to be specific about which. Records needed to stop a banned member returning: 12 months. Payment and transaction records: 7 years, because tax law requires it. Support correspondence: 24 months. Server logs: 90 days. Records tied to an open safety investigation or legal claim: until it is resolved.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">9. Your rights and controls</h2>
            <p className="text-ink-soft mb-3"><strong>See and correct.</strong> Your profile is editable at any time from your account.</p>
            <p className="text-ink-soft mb-3"><strong>Delete.</strong> Settings contains a Delete account option that removes your account and data. You do not need to email us to do it.</p>
            <p className="text-ink-soft mb-3"><strong>Export.</strong> Settings also lets you download a copy of your data.</p>
            <p className="text-ink-soft mb-3"><strong>Withdraw consent.</strong> Remove sensitive preference data by editing your preferences, or delete your account entirely.</p>
            <p className="text-ink-soft mb-3"><strong>Block and report.</strong> Every profile and conversation has both. Blocking removes that person from your Discover queue and stops them contacting you.</p>
            <p className="text-ink-soft mb-3">Depending on where you live you may also have rights to object to or restrict processing, to portability, and to complain to your data protection authority. Write to {CONTACT_EMAIL} and we will help.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">10. Sensitive data, including health-related data</h2>
            <p className="text-ink-soft mb-3">Some of what a dating app collects is legally sensitive. Your stated interest in men, women, or both can reveal sexual orientation, and in Washington and Nevada information of that kind may be treated as consumer health data under state law.</p>
            <p className="text-ink-soft mb-3">We collect it only because it is necessary to match you with the people you want to meet, only with your consent, and we do not sell it or share it for advertising. You can change or remove it whenever you like.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">11. Security</h2>
            <p className="text-ink-soft mb-3">Data is encrypted in transit. Access to production systems is limited to those who need it. Passwords are hashed by our authentication provider and are never visible to us.</p>
            <p className="text-ink-soft mb-3">No service can promise perfect security. If a breach ever affects your personal data, we will notify you and the relevant authorities as the law requires.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">12. You must be 18</h2>
            <p className="text-ink-soft mb-3">{APP_NAME} is for adults only. We do not knowingly collect data from anyone under 18. If we learn that a member is under 18, we remove the account and delete the data.</p>
            <p className="text-ink-soft mb-3">If you believe a minor is using {APP_NAME}, please report it immediately so we can act.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">13. Where your data is held</h2>
            <p className="text-ink-soft mb-3">We operate in the United States and our providers may process and store data there and in other countries. Where data moves across borders, we rely on our providers&rsquo; standard contractual protections.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">14. Changes to this policy</h2>
            <p className="text-ink-soft mb-3">We will update this policy as {APP_NAME} changes. The date at the top always reflects the current version, and we will tell you before a material change takes effect.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">15. Contact</h2>
            <p className="text-ink-soft mb-3">Questions, requests, or complaints about privacy can be sent to {CONTACT_EMAIL}. We read everything and will respond as quickly as we reasonably can.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
