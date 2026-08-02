"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 10);
  if (digits.length > 6) return `(${part1}) ${part2}-${part3}`;
  if (digits.length > 3) return `(${part1}) ${part2}`;
  if (digits.length > 0) return `(${part1}`;
  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"email" | "phone">("email");

  // Email mode state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Phone mode state
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

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

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError(null);
    setResendMessage(null);

    const e164 = toE164(phone);
    if (!e164) {
      setPhoneError("Enter a valid 10-digit U.S. phone number.");
      return;
    }

    setPhoneLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: false },
    });

    if (error) {
      if (/user not found|signups not allowed for otp/i.test(error.message)) {
        setPhoneError("No account found for that number. Sign up first.");
      } else {
        setPhoneError(error.message);
      }
      setPhoneLoading(false);
      return;
    }

    setPhoneStep("enter-code");
    setPhoneLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError(null);

    const e164 = toE164(phone);
    if (!e164) {
      setPhoneError("Something went wrong with that phone number. Go back and re-enter it.");
      return;
    }

    setPhoneLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code,
      type: "sms",
    });

    if (error) {
      setPhoneError(error.message);
      setPhoneLoading(false);
      return;
    }

    router.push("/app/discover");
    router.refresh();
  }

  async function handleResendCode() {
    const e164 = toE164(phone);
    if (!e164) return;
    setPhoneLoading(true);
    setPhoneError(null);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: false },
    });
    setResendMessage(error ? null : "New code sent.");
    setPhoneError(error ? error.message : null);
    setPhoneLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream text-ink">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← {APP_NAME}
        </Link>
        <h1 className="text-2xl font-extrabold mt-4 mb-6 tracking-tight">Log in</h1>

        <div className="flex mb-6 rounded-xl border border-line bg-card p-1">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "email" ? "bg-brand text-white" : "text-ink-soft"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "phone" ? "bg-brand text-white" : "text-ink-soft"
            }`}
          >
            Phone
          </button>
        </div>

        {mode === "email" ? (
          <>
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
              {needsConfirmation && (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={loading}
                  className="min-h-11 text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              )}
              {confirmationSent && (
                <p className="text-sm font-semibold text-brand">
                  Confirmation email sent. Open the link in your inbox, then return here to log in.
                </p>
              )}
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
          </>
        ) : phoneStep === "enter-phone" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="flex items-center rounded-xl bg-card border border-line px-4 py-3 focus-within:border-brand transition-colors">
              <span className="text-ink-soft mr-2">+1</span>
              <input
                type="tel"
                required
                inputMode="numeric"
                placeholder="(512) 555-0100"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent outline-none"
              />
            </div>
            {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
            <button
              type="submit"
              disabled={phoneLoading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
            >
              {phoneLoading ? "Sending code…" : "Text me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-ink-soft">
              Enter the 6-digit code we texted to +1 {formatPhoneDisplay(phone)}.
            </p>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl bg-card border border-line px-4 py-3 outline-none focus:border-brand transition-colors tracking-[0.3em] text-center text-lg"
            />
            {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
            {resendMessage && <p className="text-sm font-semibold text-brand">{resendMessage}</p>}
            <button
              type="submit"
              disabled={phoneLoading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
            >
              {phoneLoading ? "Verifying…" : "Log in"}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setPhoneStep("enter-phone");
                  setCode("");
                  setPhoneError(null);
                  setResendMessage(null);
                }}
                className="text-ink-soft hover:text-ink"
              >
                ← Change number
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={phoneLoading}
                className="text-brand hover:text-brand-dark font-semibold disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

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
