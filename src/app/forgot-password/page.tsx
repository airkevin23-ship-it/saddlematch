"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream text-ink">
      <div className="w-full max-w-sm">
        <Link href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors">← Back to log in</Link>
        <h1 className="text-2xl font-extrabold mt-4 mb-2 tracking-tight">Reset your password</h1>
        <p className="text-sm text-ink-soft mb-6">Enter the email address you used for {APP_NAME}. We’ll send a secure reset link.</p>
        {sent ? (
          <div className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft leading-relaxed">If an account exists for that email, a password-reset link is on its way. Check your inbox and spam folder.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full min-h-12 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-xl font-bold transition-colors">{loading ? "Sending…" : "Send reset link"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
