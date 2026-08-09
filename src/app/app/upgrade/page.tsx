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
    <div className="mx-auto min-h-screen max-w-md bg-cream px-6 py-12 text-ink">
      {searchParams.get("success") && (
        <p className="mb-6 text-center text-sm font-semibold text-green-700">
          You&rsquo;re on Plus! It may take a few seconds to activate.
        </p>
      )}
      {searchParams.get("canceled") && (
        <p className="mb-6 text-center text-sm text-ink-soft">Checkout canceled.</p>
      )}

      <div className="text-center">
        <span className="text-4xl" aria-hidden="true">✨</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{APP_NAME} Plus</h1>
        <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-ink-soft">
          {isActive
            ? `Thanks for backing ${APP_NAME}. Everything below is unlocked.`
            : "Become better at dating\u2014not just swiping."}
        </p>
      </div>

      <ul className="mt-9 space-y-3.5">
        {PLUS_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="text-base font-medium leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {!isActive && (
        <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-card text-left text-sm">
          <div className="border-r border-line p-4">
            <p className="font-extrabold text-ink">Free</p>
            <p className="mt-1 leading-relaxed text-ink-soft">1 thoughtfully curated profile each day</p>
          </div>
          <div className="bg-brand-soft/50 p-4">
            <p className="font-extrabold text-brand-dark">Plus</p>
            <p className="mt-1 leading-relaxed text-ink-soft">Up to 8 curated profiles each day, plus every feature above</p>
          </div>
        </div>
      )}

      <div className="mt-10">
        <p className="text-center text-4xl font-extrabold tracking-tight">
          {isActive ? SUBSCRIPTION_PRICE_LABEL : SUBSCRIPTION_INTRO_PRICE_LABEL}
        </p>
        {/* The intro price is a limited offer, so the ongoing price has to be
            on the same screen as the number people actually read. */}
        <p className="mt-1.5 text-center text-xs leading-relaxed text-ink-soft">
          {isActive
            ? "Cancel anytime."
            : `${SUBSCRIPTION_INTRO_PERIOD}, then ${SUBSCRIPTION_PRICE_LABEL}. Cancel anytime.`}
        </p>
        {!isActive && (
          <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
            Your subscription renews monthly until canceled. Manage or cancel anytime in Settings.
          </p>
        )}

        {isActive ? (
          <button
            onClick={handleManage}
            disabled={portalLoading}
            className="mt-6 min-h-13 w-full rounded-full border-2 border-line-strong py-3.5 font-bold transition-colors hover:border-ink disabled:opacity-50"
          >
            {portalLoading ? "Loading…" : "Manage subscription"}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-6 min-h-13 w-full rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Upgrade"}
          </button>
        )}
      </div>
    </div>
  );
}
