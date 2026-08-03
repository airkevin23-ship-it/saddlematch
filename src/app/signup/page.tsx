"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError("You need to confirm you're 18+ and agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled on the Supabase project, a session
    // comes back immediately and we can go straight to onboarding.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen justify-center bg-line/40 text-ink">
        <div className="flex min-h-screen w-full max-w-[480px] items-center justify-center bg-cream px-6 text-center shadow-[0_0_60px_rgba(27,25,23,0.10)]">
        <div>
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Check your email</h1>
          <p className="text-ink-soft">
            We sent a confirmation link to {email}. Click it to finish setting
            up your account.
          </p>
        </div>
        </div>
      </main>
    );
  }

  return (
    // Phone-width column so the sign-up form matches the app it leads into.
    <main className="flex min-h-screen justify-center bg-line/40 text-ink">
      <div className="flex min-h-screen w-full max-w-[480px] items-center justify-center bg-cream px-6 shadow-[0_0_60px_rgba(27,25,23,0.10)]">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-2xl font-extrabold mt-4 mb-6 tracking-tight">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />

          <label className="flex items-start gap-2.5 text-xs text-ink-soft leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-brand w-4 h-4"
            />
            <span>
              I confirm I&rsquo;m 18 or older and agree to the{" "}
              <Link href="/terms" target="_blank" className="text-brand hover:text-brand-dark font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-brand hover:text-brand-dark font-medium">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:text-brand-dark font-semibold">
            Log in
          </Link>
        </p>
      </div>
      </div>
    </main>
  );
}
