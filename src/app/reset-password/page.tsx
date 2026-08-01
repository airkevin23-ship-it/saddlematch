"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirmPassword) return setError("Those passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Your reset link may have expired. Request a new one and try again.");
      setLoading(false);
      return;
    }
    router.push("/app/discover");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream text-ink">
      <div className="w-full max-w-sm">
        <Link href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors">← Back to log in</Link>
        <h1 className="text-2xl font-extrabold mt-4 mb-6 tracking-tight">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" required minLength={8} placeholder="New password (min. 8 characters)" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors" />
          <input type="password" required minLength={8} placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full min-h-12 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-xl font-bold transition-colors">{loading ? "Updating…" : "Update password"}</button>
        </form>
      </div>
    </main>
  );
}
