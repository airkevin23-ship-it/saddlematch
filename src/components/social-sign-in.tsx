"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Social sign-in is CONVENIENCE, not verification. A Facebook or Google account
// proves someone has that account, not that they are the person in the photos,
// so nothing here awards a badge. Photo verification is what earns a check mark.
//
// Providers only render when they are listed in NEXT_PUBLIC_OAUTH_PROVIDERS,
// because each one needs credentials configured in Supabase first. Shipping a
// button before its provider exists gives the user a dead end with no
// explanation, which is exactly how the phone signup failed.
//
// Example: NEXT_PUBLIC_OAUTH_PROVIDERS="google,apple,facebook"

type Provider = "google" | "apple" | "facebook";

const LABELS: Record<Provider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
  facebook: "Continue with Facebook",
};

function enabledProviders(): Provider[] {
  const raw = process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Provider => s === "google" || s === "apple" || s === "facebook");
}

export default function SocialSignIn({ next }: { next?: string }) {
  const supabase = createClient();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providers = enabledProviders();

  if (providers.length === 0) return null;

  async function start(provider: Provider) {
    setBusy(provider);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback` + (next ? `?next=${encodeURIComponent(next)}` : "");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthError) {
      setError("We could not open that sign-in. Please try another way.");
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-ink-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-3 space-y-2">
        {providers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => start(p)}
            disabled={busy !== null}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line-strong bg-card px-4 text-sm font-bold text-ink disabled:opacity-50"
          >
            {busy === p ? "Opening\u2026" : LABELS[p]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
