import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { actionReport, dismissReports } from "./actions";

export default async function ModerationPage() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/login");

  const { data: moderator } = await session.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!moderator?.is_admin) redirect("/app/discover");

  const admin = createAdminClient();
  const { data: reports } = await admin.from("reports").select("reported_id, reason, details, created_at").eq("status", "open").order("created_at", { ascending: false });
  const openReports = reports ?? [];
  const ids = [...new Set(openReports.map((report) => report.reported_id))];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, display_name, is_visible").in("id", ids) : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-cream px-5 py-10 text-ink sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">SaddleMatch safety</p>
      <h1 className="mt-2 text-3xl font-extrabold">Report moderation</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">Review open reports carefully. Dismissing restores visibility; actioning keeps a profile hidden from Discover.</p>
      <div className="mt-7 space-y-4">
        {openReports.length === 0 ? (
          <section className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">There are no open reports to review.</section>
        ) : openReports.map((report) => {
          const profile = profilesById.get(report.reported_id);
          const isQuarantined = profile?.is_visible === false;
          return (
            <section key={report.reported_id} className="rounded-2xl border border-line bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{profile?.display_name ?? "Member"}</h2>
                  <p className="mt-1 text-sm text-ink-soft">Reason: {report.reason}</p>
                  {report.details && <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm text-ink-soft">{report.details}</p>}
                </div>
                <span className={"rounded-full px-2 py-1 text-xs font-bold " + (isQuarantined ? "bg-red-50 text-red-700" : "bg-brand-soft text-brand-dark")}>
                  {isQuarantined ? "Quarantined" : "Visible"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <form action={dismissReports.bind(null, report.reported_id)}><button className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-bold text-ink-soft hover:bg-cream">Dismiss & restore</button></form>
                <form action={actionReport.bind(null, report.reported_id)}><button className="min-h-11 w-full rounded-xl bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700">Action & keep hidden</button></form>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
