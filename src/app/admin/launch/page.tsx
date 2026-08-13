import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { launchNow, revertToPreLaunch, updateTarget } from "./actions";

export default async function LaunchAdminPage() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    redirect("/app/discover");
  }

  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("launch_settings")
    .select("is_launched, target_member_count, launched_at")
    .eq("id", true)
    .single();

  const { count: qualifyingCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("is_quarantined", false)
    .not("photo_urls", "eq", "{}");

  const isLaunched = settings?.is_launched ?? false;
  const target = settings?.target_member_count ?? 500;
  const qualifying = qualifyingCount ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((qualifying / target) * 100)) : 0;

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-cream px-5 py-10 text-ink sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">SaddleMatch admin</p>
        <a href="/admin/moderation" className="text-xs font-bold text-ink-soft underline underline-offset-4 hover:text-ink">Report moderation</a>
      </div>
      <h1 className="mt-2 text-3xl font-extrabold">Launch settings</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        While pre-launch, Discover, Likes, and Matches show a holding screen to everyone instead of
        live content. Profile, Settings, and Preferences stay open so people can finish their
        profile while they wait. Flipping this on unlocks the app for every signed-up member at
        once.
      </p>

      <section className="mt-7 rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Status</p>
            <p className="mt-1 text-lg font-extrabold">
              {isLaunched ? "Live" : "Pre-launch"}
            </p>
            {isLaunched && settings?.launched_at && (
              <p className="mt-1 text-xs text-ink-soft">
                Launched {new Date(settings.launched_at).toLocaleString()}
              </p>
            )}
          </div>
          <form action={isLaunched ? revertToPreLaunch : launchNow}>
            <button
              type="submit"
              className={`min-h-11 rounded-full px-5 text-sm font-bold text-white transition-colors ${
                isLaunched
                  ? "bg-ink-soft hover:bg-ink"
                  : "bg-brand hover:bg-brand-dark"
              }`}
            >
              {isLaunched ? "Revert to pre-launch" : "Launch SaddleMatch now"}
            </button>
          </form>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-bold">
              {qualifying} of {target} founding members
            </span>
            <span className="text-ink-soft">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            A member counts once their profile is active, not quarantined, and has at least one
            photo.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Target</p>
        <form action={updateTarget} className="mt-2 flex items-center gap-3">
          <input
            type="number"
            name="target_member_count"
            defaultValue={target}
            min={1}
            className="min-h-11 w-32 rounded-xl border border-line bg-cream px-3 text-sm font-bold outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="min-h-11 rounded-full border-2 border-line-strong px-5 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Update target
          </button>
        </form>
      </section>
    </main>
  );
}
