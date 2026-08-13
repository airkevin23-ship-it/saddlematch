import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, NOTIFY_FROM } from "@/lib/resend";

export type NotificationKind = "matches" | "messages";

// Settings stores per-user toggles at profile.preference_details.notifications
// (the Settings screen already renders "New matches" / "New messages"
// switches — this is the first thing that actually reads them). A missing
// key defaults to enabled, matching the Settings screen's own defaults.
export async function getNotifiableUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  kind: NotificationKind
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, preference_details")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  const prefs = (profile.preference_details ?? {}) as {
    notifications?: Partial<Record<NotificationKind, boolean>>;
  };
  const enabled = prefs.notifications?.[kind] !== false;
  if (!enabled) return null;

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return null;

  return { displayName: profile.display_name as string, email };
}

// Best-effort send — a notification failure should never surface to the
// user action (sending a message, matching) that triggered it.
export async function sendNotificationEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping notification send to", to);
    return false;
  }
  try {
    await getResendClient().emails.send({ from: NOTIFY_FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error("Failed to send notification email", err);
    return false;
  }
}
