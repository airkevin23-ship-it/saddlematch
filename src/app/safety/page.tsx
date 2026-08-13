import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Safety Policy — ${APP_NAME}`,
};

const SAFETY_STEPS = [
  {
    title: "Adults only",
    body: "You must be 18 or older to create an account. We ask every member to confirm this before joining.",
  },
  {
    title: "You control your profile",
    body: "Members see your first name, age, city, photos, and profile answers. Your email, birthdate, and exact location are never displayed.",
  },
  {
    title: "Block and report without a conversation",
    body: "You can block someone at any time. They cannot contact you or see your profile, and you do not need to explain why. Reports are reviewed by SaddleMatch.",
  },
  {
    title: "Keep early conversations in the app",
    body: "Take your time before sharing a phone number, home address, workplace, or financial information. Be cautious of anyone who pressures you to move off-platform quickly.",
  },
  {
    title: "Meet thoughtfully",
    body: "For a first date, choose a public place, tell a friend where you will be, arrange your own transportation, and trust your instincts. Leave if something does not feel right.",
  },
];

const AWARENESS_TIPS = [
  "Anyone who is able to commit identity theft can also falsify a dating profile.",
  "There is no substitute for acting with caution when communicating with any stranger who wants to meet you.",
  "Never include your last name, email address, home address, phone number, place of work, or any other identifying information in your profile or early messages. Stop communicating with anyone who pressures you for personal or financial information or tries to trick you into revealing it.",
  "If you choose to have a face-to-face meeting with another member, always tell someone in your family or a friend where you are going and when you will return. Never agree to be picked up at your home. Always provide your own transportation to and from your date and meet in a public place with many people around.",
];

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          &larr; {APP_NAME}
        </Link>
        <p className="text-xs uppercase tracking-widest font-bold text-brand mt-8 mb-3">Your safety matters</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Safety Policy</h1>
        <p className="text-ink-soft mt-4 leading-relaxed">
          SaddleMatch is built for intentional local dating. No app can guarantee every interaction is safe, but these tools and practices help you stay in control.
        </p>

        <div className="mt-8 rounded-2xl border-2 border-red-700 bg-red-50 p-6">
          <p className="text-sm font-extrabold uppercase tracking-tight text-red-800">
            SADDLEMATCH DOES NOT CONDUCT CRIMINAL BACKGROUND SCREENINGS ON ITS MEMBERS.
          </p>
          <p className="text-sm text-red-900 mt-2 leading-relaxed">
            We do not run criminal background checks, sex-offender registry checks, or identity verification beyond
            self-reported signup information. A clean-looking profile is not proof of anything. Use the safety
            practices on this page every time you talk to or meet someone new.
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {SAFETY_STEPS.map((step, index) => (
            <section key={step.title} className="rounded-2xl border border-line bg-card p-6">
              <p className="text-xs font-bold text-brand mb-2">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="font-extrabold text-lg">{step.title}</h2>
              <p className="text-sm text-ink-soft leading-relaxed mt-2">{step.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-extrabold text-lg">Safety awareness</h2>
          <ul className="mt-3 space-y-3">
            {AWARENESS_TIPS.map((tip) => (
              <li key={tip} className="text-sm text-ink-soft leading-relaxed rounded-2xl border border-line bg-card p-4">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-extrabold text-lg">If you or someone you know needs help</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            These resources are available to anyone, whether or not what happened involved SaddleMatch. If you are
            in immediate danger, call 911.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li>
              <span className="font-bold text-ink">National Sexual Assault Hotline (RAINN):</span> 1-800-656-4673, or chat at{" "}
              <a href="https://hotline.rainn.org" target="_blank" rel="noreferrer" className="text-brand font-semibold underline">
                hotline.rainn.org
              </a>
            </li>
            <li>
              <span className="font-bold text-ink">National Domestic Violence Hotline:</span> 1-800-799-7233, or text
              &ldquo;START&rdquo; to 88788
            </li>
            <li>
              <span className="font-bold text-ink">988 Suicide &amp; Crisis Lifeline:</span> call or text 988
            </li>
            <li>
              <span className="font-bold text-ink">To report something illegal or urgent:</span> contact your local
              police department or dial 911
            </li>
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="font-extrabold">Need help with an account or safety concern?</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            Use the in-app report tool first when available. For account and privacy questions, review our <Link href="/privacy" className="text-brand font-semibold underline">Privacy Policy</Link> and <Link href="/terms" className="text-brand font-semibold underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
