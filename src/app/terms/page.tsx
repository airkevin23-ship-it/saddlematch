import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated July 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-bold text-base mb-2">1. Who can use {APP_NAME}</h2>
            <p className="text-ink-soft">
              You must be at least 18 years old to create an account. By signing up
              you confirm that you meet this requirement and that the information
              on your profile is accurate and about you — not a fictional
              persona, a business, or another person.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">2. Your conduct</h2>
            <p className="text-ink-soft">
              Treat other members the way you&rsquo;d want to be treated. Harassment,
              hate speech, threats, impersonation, and sharing sexually explicit
              content without consent are not allowed and can get your account
              suspended or removed. Use the block and report tools if someone
              makes you uncomfortable — we review every report.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">3. Your content</h2>
            <p className="text-ink-soft">
              You own the photos, prompt answers, and messages you post. By
              posting them on {APP_NAME}, you give us permission to display them
              to other members as part of running the service. You&rsquo;re
              responsible for making sure you have the right to share anything
              you upload.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">4. AI features</h2>
            <p className="text-ink-soft">
              Some optional Plus features use AI to help you write prompt
              answers, highlight things you might have in common with someone,
              or suggest an opening message. These are suggestions only — you
              decide what goes on your profile and what you send, and nothing
              is posted or sent without your action.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">5. Subscriptions</h2>
            <p className="text-ink-soft">
              Plus is a monthly subscription billed through Stripe. You can
              cancel anytime from your account settings; you&rsquo;ll keep Plus
              access through the end of the billing period you&rsquo;ve already paid
              for.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">6. Account termination</h2>
            <p className="text-ink-soft">
              We can suspend or remove accounts that violate these terms. You
              can delete your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">7. Changes</h2>
            <p className="text-ink-soft">
              We may update these terms as {APP_NAME} evolves. We&rsquo;ll post the
              updated date at the top of this page when we do.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
