"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Pre-signup value-prop flow, shown after someone taps "Create My Free
// Profile" on the homepage and before the actual signup form. Each screen
// makes one point. This is where the stuff that used to live on the
// homepage (one match a day, prompt-based profiles, AI help, the Austin
// community angle) now lives — a curious visitor still sees it, just one
// idea at a time instead of all at once before they've decided anything.
const SCREENS = [
  {
    emoji: "❤️",
    title: "One Match Every Day",
    body: "Stop endlessly swiping. We introduce one thoughtful match each day.",
  },
  {
    emoji: "💬",
    title: "Personality Before Photos",
    body: "Prompt-based profiles help you know the person before you swipe.",
  },
  {
    emoji: "🤖",
    title: "AI Helps Break the Ice",
    body: "Never wonder what to say first.",
  },
  {
    emoji: "🤠",
    title: "Built for Austin",
    body: "Two-stepping. Rodeos. Live music. Real people.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === SCREENS.length - 1;
  const screen = SCREENS[step];

  function handleContinue() {
    if (isLast) {
      router.push("/signup");
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }

  return (
    // Phone-width column, same as the landing page and the signed-in app, so
    // the whole sign-up path looks like one continuous mobile app.
    <main className="flex min-h-screen justify-center bg-line/40 text-ink">
      <div className="flex min-h-screen w-full max-w-[480px] flex-col bg-cream px-6 py-8 shadow-[0_0_60px_rgba(27,25,23,0.10)]">
      <button
        onClick={handleBack}
        className="text-sm text-ink-faint hover:text-ink-soft font-medium self-start min-h-11 -ml-1 px-1"
      >
        ← Back
      </button>

      <div className="mx-auto flex w-full min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto text-center max-w-sm">
        <span className="text-5xl mb-6" aria-hidden="true">
          {screen.emoji}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight mb-3">{screen.title}</h1>
        <p className="text-ink-soft leading-relaxed">{screen.body}</p>

        {step === 1 && (
          <div className="mt-6 w-full max-w-[260px] shrink-0 overflow-hidden rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.06]">
            <div className="h-[34vh] max-h-[340px] min-h-[150px] overflow-hidden bg-line">
              <img
                src="/maddie-profile.png"
                alt="Maddie enjoying an Austin evening"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="p-4 text-left">
              <p className="font-extrabold text-sm">Maddie, 27</p>
              <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                <li>❤️ Loves two-stepping</li>
                <li>🌮 Favorite BBQ: the Salt Lick</li>
                <li>🐴 Weekend trail rides</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
        {SCREENS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-6 bg-brand" : "w-1.5 bg-line-strong"
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleContinue}
        className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-full font-bold transition-colors min-h-12"
      >
        {isLast ? "Get Started" : "Continue"}
      </button>
      </div>
    </main>
  );
}
