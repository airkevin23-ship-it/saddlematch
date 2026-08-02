import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { actionReport, dismissReports } from "./actions";

interface ReportRow {
    id: string;
    reported_id: string;
    reporter_id: string;
    reason: string;
    details: string | null;
    created_at: string;
}

interface ProfileRow {
    id: string;
    display_name: string;
    is_quarantined: boolean;
}

export default async function ModerationPage() {
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
          redirect("/app/discover");
    }

  const admin = createAdminClient();
    const { data: reports } = await admin
      .from("reports")
      .select("id, reported_id, reporter_id, reason, details, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

  const openReports = (reports ?? []) as ReportRow[];
    const profileIds = [...new Set(openReports.flatMap((report) => [report.reported_id, report.reporter_id]))];
    const { data: profiles } = profileIds.length
      ? await admin.from("profiles").select("id, display_name, is_quarantined").in("id", profileIds)
          : { data: [] };
    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));

  const grouped = new Map<string, ReportRow[]>();
    for (const report of openReports) {
          const existing = grouped.get(report.reported_id) ?? [];
          existing.push(report);
          grouped.set(report.reported_id, existing);
    }
    const reportGroups = [...grouped.entries()];

  return (
        <main className="mx-auto min-h-screen max-w-3xl bg-cream px-5 py-10 text-ink sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">SaddleMatch safety</p>p>
              <h1 className="mt-2 text-3xl font-extrabold">Report moderation</h1>h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">Review open reports carefully. Dismissing restores visibility; actioning keeps a profile hidden from Discover.</p>p>
              <div className="mt-7 space-y-4">
                {reportGroups.length === 0 ? (
                    <section className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">There are no open reports to review.</section>section>
                  ) : (
                    reportGroups.map(([reportedId, groupReports]) => {
                                  const profile = profilesById.get(reportedId);
                                  const isQuarantined = profile?.is_quarantined === true;
                                  return (
                                                  <section key={reportedId} className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                                                                  <div className="flex items-start justify-between gap-3">
                                                                                    <div>
                                                                                                        <h2 className="font-bold">{profile?.display_name ?? "Member"}</h2>h2>
                                                                                                        <p className="mt-1 text-xs font-semibold text-ink-soft">{groupReports.length} report{groupReports.length > 1 ? "s" : ""}</p>p>
                                                                                      </div>div>
                                                                                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${isQuarantined ? "bg-red-50 text-red-700" : "bg-brand-soft text-brand-dark"}`}>{isQuarantined ? "Quarantined" : "Visible"}</span>span>
                                                                  </div>div>
                                                                  <div className="mt-3 space-y-2">
                                                                    {groupReports.map((report) => (
                                                                        <div key={report.id} className="rounded-xl bg-cream px-3 py-2 text-sm text-ink-soft">
                                                                                              <p><span className="font-semibold text-ink">Reason:</span>span> {report.reason}</p>p>
                                                                          {report.details ? <p className="mt-1">{report.details}</p>p> : null}
                                                                                              <p className="mt-1 text-xs text-ink-soft">Reported by {profilesById.get(report.reporter_id)?.display_name ?? "a member"}</p>p>
                                                                        </div>div>
                                                                      ))}
                                                                  </div>div>
                                                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                                                                    <form action={dismissReports.bind(null, reportedId)}><button className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-bold text-ink-soft hover:bg-cream">Dismiss &amp; restore</button>button></form>form>
                                                                                    <form action={actionReport.bind(null, reportedId)}><button className="min-h-11 w-full rounded-xl bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700">Action &amp; keep hidden</button>button></form>form>
                                                                  </div>div>
                                                  </section>section>
                                                );
                    })
                  )}
              </div>div>
        </main>main>
      );
}
</main>
