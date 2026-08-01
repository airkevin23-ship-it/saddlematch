"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setConfirmationSent(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setError("Please confirm your email before logging in.");
        setNeedsConfirmation(true);
      } else if (/invalid login credentials/i.test(error.message)) {
        setError("That email and password do not match. Passwords are case-sensitive.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push("/app/discover");
    router.refresh();
  }

  async function resendConfirmation() {
    if (!email) {
      setError("Enter your email address first, then resend the confirmation.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setConfirmationSent(!error);
    setError(error ? error.message : null);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream text-ink">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-2xl font-extrabold mt-4 mb-6 tracking-tight">Log in</h1>

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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {needsConfirmation && <button type="button" onClick={resendConfirmation} disabled={loading} className="min-h-11 text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50">Resend confirmation email</button>}
          {confirmationSent && <p className="text-sm font-semibold text-brand">Confirmation email sent. Open the link in your inbox, then return here to log in.</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <Link href="/forgot-password" className="mt-4 inline-flex min-h-11 items-center text-sm text-brand hover:text-brand-dark font-semibold">
          Forgot password?
        </Link>

        <p className="text-sm text-ink-soft mt-3">
          No account?{" "}
          <Link href="/signup" className="text-brand hover:text-brand-dark font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
