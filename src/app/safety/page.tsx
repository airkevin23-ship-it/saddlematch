import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Safety at ${APP_NAME}`,
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

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          &larr; {APP_NAME}
        </Link>
        <p className="text-xs uppercase tracking-widest font-bold text-brand mt-8 mb-3">Your safety matters</p>
        <h1 className="text-3xl font-extrabold tracking-tight">How SaddleMatch safety works</h1>
        <p className="text-ink-soft mt-4 leading-relaxed">
          SaddleMatch is built for intentional local dating. No app can guarantee every interaction is safe, but these tools and practices help you stay in control.
        </p>

        <div className="mt-10 space-y-5">
          {SAFETY_STEPS.map((step, index) => (
            <section key={step.title} className="rounded-2xl border border-line bg-card p-6">
              <p className="text-xs font-bold text-brand mb-2">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="font-extrabold text-lg">{step.title}</h2>
              <p className="text-sm text-ink-soft leading-relaxed mt-2">{step.body}</p>
            </section>
          ))}
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
