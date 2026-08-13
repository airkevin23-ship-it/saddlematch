"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, PublicProfile } from "@/types/db";

type NotificationSettings = { likes: boolean; matches: boolean; messages: boolean };
const DEFAULT_NOTIFICATIONS: NotificationSettings = { likes: true, matches: true, messages: true };

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [blocked, setBlocked] = useState<PublicProfile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!data) return;
      setProfile(data);
      const stored = (data.preference_details as unknown as { notifications?: Partial<NotificationSettings> } | undefined)?.notifications;
      setNotifications({ ...DEFAULT_NOTIFICATIONS, ...(stored ?? {}) });
      const { data: rows } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
      const ids = rows?.map((row) => row.blocked_id) ?? [];
      if (ids.length) {
        const { data: people } = await supabase.from("public_profiles").select("*").in("id", ids);
        setBlocked(people ?? []);
      }
    })();
  }, [supabase]);

  async function save(nextActive = profile?.is_active, nextNotifications = notifications) {
    if (!profile) return;
    setSaving(true);
    const currentDetails = (profile.preference_details ?? {}) as unknown as Record<string, unknown>;
    const { error } = await supabase.from("profiles").update({
      is_active: nextActive,
      preference_details: { ...currentDetails, notifications: nextNotifications } as unknown as Record<string, string>,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    if (error) setMessage("We couldn't save that change. Please try again.");
    else {
      setProfile({ ...profile, is_active: Boolean(nextActive) });
      setNotifications(nextNotifications);
      setMessage("Settings saved.");
    }
    setSaving(false);
  }

  async function unblock(person: PublicProfile) {
    if (!confirm(`Unblock ${person.display_name}? They may appear in Discover again.`)) return;
    const { error } = await supabase.from("blocks").delete().eq("blocked_id", person.id);
    if (error) setMessage("We couldn't unblock that person. Please try again.");
    else setBlocked((current) => current.filter((item) => item.id !== person.id));
  }

  async function deleteAccount() {
    if (!confirm("Delete your account? This permanently removes your profile, matches, and messages and can\u2019t be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      router.push("/");
      return;
    }
    setDeleting(false);
    setMessage("We couldn\u2019t delete your account. Please try again.");
  }

  async function downloadData() {
    if (!profile) return;
    const { data: matches } = await supabase.from("matches").select("*").or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`);
    const matchIds = matches?.map((match) => match.id) ?? [];
    const { data: messages } = matchIds.length ? await supabase.from("messages").select("*").in("match_id", matchIds) : { data: [] };
    const exportData = { exportedAt: new Date().toISOString(), profile, matches: matches ?? [], messages: messages ?? [] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "saddlematch-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!profile) return <div className="min-h-screen bg-cream px-6 py-10 text-ink-soft">Loading settings...</div>;

  return <div className="min-h-screen bg-cream pb-28 text-ink">
    <header className="sticky top-0 z-10 flex min-h-16 items-center border-b border-line bg-cream/95 px-4 backdrop-blur"><Link href="/app/profile" className="grid min-h-11 min-w-11 place-items-center text-2xl" aria-label="Back to profile">×</Link><h1 className="ml-2 text-2xl font-extrabold tracking-tight">Settings</h1></header>
    <main className="mx-auto max-w-xl px-4 py-6 space-y-7">
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Profile</p><div className="mt-2 rounded-2xl border border-line bg-card p-4"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">Pause Discover</h2><p className="mt-1 text-sm leading-relaxed text-ink-soft">You disappear from Discover. Nobody new sees your profile, and you can still chat with current matches.</p></div><button type="button" disabled={saving} onClick={() => save(!profile.is_active)} className={`relative mt-1 h-8 w-14 rounded-full transition-colors ${profile.is_active ? "bg-brand" : "bg-line-strong"}`} aria-label="Pause Discover"><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${profile.is_active ? "translate-x-7" : "translate-x-1"}`} /></button></div></div></section>
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Notifications</p><div className="mt-2 rounded-2xl border border-line bg-card px-4">{([['likes','New likes'],['matches','New matches'],['messages','New messages']] as const).map(([key,label]) => <div key={key} className="flex items-center justify-between border-b border-line py-4 last:border-0"><span className="font-bold">{label}</span><button type="button" disabled={saving} onClick={() => save(profile.is_active, { ...notifications, [key]: !notifications[key] })} className={`relative h-8 w-14 rounded-full transition-colors ${notifications[key] ? "bg-brand" : "bg-line-strong"}`} aria-label={label}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${notifications[key] ? "translate-x-7" : "translate-x-1"}`} /></button></div>)}</div><p className="mt-2 text-xs text-ink-soft">These control SaddleMatch alerts. Phone push delivery will be enabled after the iPhone and Android notification service is connected.</p></section>
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Safety</p><div className="mt-2 rounded-2xl border border-line bg-card px-4"><div className="py-4"><h2 className="font-bold">Blocked members</h2>{blocked.length ? <div className="mt-3 space-y-3">{blocked.map((person) => <div key={person.id} className="flex items-center justify-between gap-3"><span className="text-sm text-ink-soft">{person.display_name}</span><button onClick={() => unblock(person)} className="min-h-10 rounded-lg border border-line px-3 text-sm font-bold text-ink">Unblock</button></div>)}</div> : <p className="mt-1 text-sm text-ink-soft">Nobody is blocked.</p>}</div></div></section>
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Account</p><div className="mt-2 rounded-2xl border border-red-200 bg-card px-4"><button type="button" onClick={deleteAccount} disabled={deleting} className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left disabled:opacity-50"><span><span className="block font-bold text-red-600">Delete account</span><span className="mt-1 block text-sm text-ink-soft">Permanently removes your profile, matches, and messages. This can&rsquo;t be undone.</span></span><span className="shrink-0 font-semibold text-red-600">{deleting ? "Deleting…" : "Delete"}</span></button></div></section>
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Your data</p><button onClick={downloadData} className="mt-2 flex min-h-14 w-full items-center justify-between rounded-2xl border border-line bg-card px-4 text-left"><span><span className="block font-bold">Download my data</span><span className="mt-1 block text-sm text-ink-soft">Download your profile, matches, and messages.</span></span><span className="text-brand">Download</span></button></section>
      {message && <p className="text-center text-sm font-semibold text-brand">{message}</p>}
      {/* Policies. These used to live in the global site footer, but that
          footer renders at full body width and collides with the tab bar, so it
          is now hidden inside the app. Settings is where an app is expected to
          keep them anyway, and Apple and Stripe both require them reachable
          from within the product rather than only on the marketing site. */}
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-faint">
          Policies
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          The rules everyone here agrees to, and what happens to your data.
        </p>
        <nav
          aria-label="Legal and policies"
          className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
        >
          {[
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/guidelines", label: "Community Guidelines" },
            { href: "/acceptable-use", label: "Acceptable Use Policy" },
            { href: "/safety", label: "Safety Policy" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="mailto:kswwllc@gmail.com"
            className="text-xs font-semibold text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
          >
            Contact
          </a>
        </nav>
      </section>
    </main>
  </div>;
}
