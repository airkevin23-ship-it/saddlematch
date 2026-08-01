import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated July 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-bold text-base mb-2">What we collect</h2>
            <p className="text-ink-soft">
              Your email and password (used only for login), your profile
              details (name, birthdate, gender, city, interests, prompt
              answers, photos), and the messages you send within matches. We
              also store your subscription status if you upgrade to Plus.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">How we use it</h2>
            <p className="text-ink-soft">
              To show your profile to potential matches in your city, to
              deliver your daily curated picks, to power optional AI writing
              and compatibility features for Plus members, and to run billing
              through Stripe. We don&rsquo;t sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Who can see what</h2>
            <p className="text-ink-soft">
              Your profile (name, photos, prompts, city) is visible to other
              members in your city who match your stated preferences. Your
              birthdate, email, and exact account details are never shown to
              other members — only your age and city.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">AI processing</h2>
            <p className="text-ink-soft">
              When you use an AI-assisted feature (prompt help, compatibility
              notes, opening-message suggestions), relevant profile details are
              sent to our AI provider to generate a suggestion. Suggestions are
              shown to you only — nothing is posted or sent automatically.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Your controls</h2>
            <p className="text-ink-soft">
              You can edit or delete your profile information at any time from
              your account. You can block or report another member, which
              prevents them from contacting you and flags the account for
              review. You can request full account deletion by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Data storage</h2>
            <p className="text-ink-soft">
              Your data is stored with Supabase (database and authentication)
              and processed for payments by Stripe. Both are industry-standard
              providers with their own security practices.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">Changes</h2>
            <p className="text-ink-soft">
              We may update this policy as {APP_NAME} evolves. We&rsquo;ll post the
              updated date at the top of this page when we do.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
