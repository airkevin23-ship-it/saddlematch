"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { APP_NAME, CITIES } from "@/lib/constants";
import { HorseshoeIcon } from "@/components/western-icons";

const SOURCES = [
  "Rodeo or country-music event",
  "Western bar",
  "Local Facebook group",
  "TikTok",
  "Friend",
  "Other",
];

function WaitlistForm() {
  const searchParams = useSearchParams();
  const preselectedCity = searchParams.get("city") ?? "";

  const [email, setEmail] = useState("");
  const [citySlug, setCitySlug] = useState(preselectedCity);
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, citySlug, source }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">
          You&rsquo;re on the list
        </h1>
        <p className="text-ink-soft">
          We&rsquo;ll email you the moment {APP_NAME} opens in your city.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Join the waitlist</h1>
      <p className="text-ink-soft mb-8 text-sm">
        We&rsquo;re opening one Texas city at a time — real local people, not
        thousands of empty accounts. Drop your email and we&rsquo;ll let you
        know the moment your city opens.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">Your city</label>
          <select
            required
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors"
          >
            <option value="" disabled>
              Choose a city
            </option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-1 font-medium">
            How&rsquo;d you hear about us? (optional)
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 text-sm outline-none focus:border-brand transition-colors"
          >
            <option value="">Prefer not to say</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
        >
          {submitting ? "Joining…" : "Join the waitlist"}
        </button>
      </form>
    </>
  );
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream text-ink">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors mb-4"
        >
          <HorseshoeIcon className="w-4 h-4" />
          {APP_NAME}
        </Link>
        <Suspense fallback={null}>
          <WaitlistForm />
        </Suspense>
      </div>
    </main>
  );
}
