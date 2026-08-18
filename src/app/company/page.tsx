import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Company — ${APP_NAME}`,
  description: `${APP_NAME} is a product built and operated by W&W Trading LLC.`,
};

const FACTS = [
  { label: "Legal business name", value: "W&W Trading LLC" },
  { label: "Product", value: `${APP_NAME} — a dating app for Austin's Western and country lifestyle community` },
  { label: "Entity type", value: "Limited liability company (LLC), United States" },
  { label: "Industry", value: "Technology — online dating / social networking" },
  { label: "Headquarters", value: "Austin, Texas, USA" },
  { label: "Website", value: "wwllcs.com" },
  { label: "Contact", value: "contact@wwllcs.com" },
];

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-cream text-ink px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          &larr; {APP_NAME}
        </Link>

        <p className="text-xs uppercase tracking-widest font-bold text-brand mt-8 mb-3">Company</p>
        <h1 className="text-3xl font-extrabold tracking-tight">W&amp;W Trading LLC</h1>
        <p className="text-ink-soft mt-4 leading-relaxed">
          {APP_NAME} is a product built and operated by W&amp;W Trading LLC, a United States
          limited liability company. W&amp;W Trading LLC owns the {APP_NAME} brand, the
          wwllcs.com domain, and is the legal entity responsible for the {APP_NAME} app and
          this website.
        </p>

        <div className="mt-10 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-extrabold text-lg mb-4">Business details</h2>
          <dl className="space-y-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint sm:w-48 sm:shrink-0">
                  {fact.label}
                </dt>
                <dd className="text-sm text-ink mt-1 sm:mt-0">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-extrabold text-lg mb-2">What we build</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            {APP_NAME} is an Austin-only dating app for people who live a Western and country
            lifestyle — ranchers, rodeo and horse people, two-steppers, and anyone who&rsquo;d
            rather meet someone at a honky-tonk than a rooftop bar. W&amp;W Trading LLC designs,
            develops, and operates the {APP_NAME} product end to end, including the mobile and
            web apps, member support, and trust &amp; safety.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="font-extrabold">Get in touch</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            For business, press, or partnership inquiries, reach W&amp;W Trading LLC at{" "}
            <a href="mailto:contact@wwllcs.com" className="text-brand font-semibold underline">
              contact@wwllcs.com
            </a>
            . For account or safety questions, see our{" "}
            <Link href="/terms" className="text-brand font-semibold underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand font-semibold underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
