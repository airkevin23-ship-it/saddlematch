"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  APP_NAME,
  PLUS_FEATURES,
  SUBSCRIPTION_INTRO_PERIOD,
  SUBSCRIPTION_INTRO_PRICE_LABEL,
  SUBSCRIPTION_PRICE_LABEL,
} from "@/lib/constants";

export default function UpgradePage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      setStatus(data?.status ?? "inactive");
    })();
  }, [supabase]);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  async function handleManage() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  }

  const isActive = status === "active" || status === "trialing";

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center bg-cream min-h-screen text-ink">
      {searchParams.get("success") && (
        <p className="mb-6 text-sm text-green-700 font-medium">
          You&rsquo;re on Plus! It may take a few seconds to activate.
        </p>
      )}
      {searchParams.get("canceled") && (
        <p className="mb-6 text-sm text-ink-soft">Checkout canceled.</p>
      )}

      <h1 className="text-2xl font-extrabold mb-2 tracking-tight">
        {isActive ? `You're on ${APP_NAME} Plus` : `Upgrade to ${APP_NAME} Plus`}
      </h1>
      <p className="text-ink-soft mb-8">
        {isActive
          ? `Thanks for supporting ${APP_NAME}. All AI features are unlocked.`
          : "Unlock AI profile feedback, better conversation starters, and match insights."}
      </p>

      <div className="rounded-3xl border border-line bg-card shadow-xl shadow-black/[0.04] p-8">
        {!isActive && (
          <p className="text-4xl font-extrabold text-brand">{SUBSCRIPTION_INTRO_PRICE_LABEL}</p>
        )}
        {isActive && (
          <p className="text-4xl font-extrabold text-brand">{SUBSCRIPTION_PRICE_LABEL}</p>
        )}
        <p className="text-ink-soft mt-1 mb-6 text-sm">
          {isActive
            ? "Cancel anytime"
            : `${SUBSCRIPTION_INTRO_PERIOD}, then ${SUBSCRIPTION_PRICE_LABEL}. Cancel anytime.`}
        </p>
        {!isActive && (
          <ul className="text-left mb-6 space-y-2 text-sm text-ink">
            {PLUS_FEATURES.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        )}

        {isActive ? (
          <button
            onClick={handleManage}
            disabled={portalLoading}
            className="w-full border-2 border-ink/15 hover:border-ink/40 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors"
          >
            {portalLoading ? "Loading…" : "Manage subscription"}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Redirecting…" : "Upgrade now"}
          </button>
        )}
      </div>
    </div>
  );
}
