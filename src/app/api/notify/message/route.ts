import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageEmail } from "@/lib/notification-emails";
import { getNotifiableUser, sendNotificationEmail } from "@/lib/notify";

const THROTTLE_MINUTES = 15;

// Called by the client right after it successfully inserts a message. We
// re-fetch the message with the admin client (never trust the client's
// claimed body/sender) and confirm the caller is the actual sender before
// notifying the other side of the match.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await request.json().catch(() => ({}));
  if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: message } = await admin
    .from("messages")
    .select("id, match_id, sender_id, body")
    .eq("id", messageId)
    .single();
  if (!message || message.sender_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: match } = await admin
    .from("matches")
    .select("id, user_a, user_b")
    .eq("id", message.match_id)
    .single();
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recipientId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: block } = await admin
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId})`
    )
    .maybeSingle();
  if (block) return NextResponse.json({ ok: true, skipped: "blocked" });

  // Throttle: at most one "new message" email per match per recipient every
  // 15 minutes, so an active back-and-forth doesn't flood an inbox.
  const throttleSince = new Date(Date.now() - THROTTLE_MINUTES * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("notification_log")
    .select("id")
    .eq("match_id", match.id)
    .eq("recipient_id", recipientId)
    .eq("kind", "message")
    .gte("sent_at", throttleSince)
    .maybeSingle();
  if (recent) return NextResponse.json({ ok: true, skipped: "throttled" });

  const [recipient, sender] = await Promise.all([
    getNotifiableUser(admin, recipientId, "messages"),
    admin.from("profiles").select("display_name").eq("id", user.id).single(),
  ]);
  if (!recipient || !sender.data) return NextResponse.json({ ok: true, skipped: "opted_out" });

  const { subject, html } = messageEmail({
    recipientName: recipient.displayName,
    senderName: sender.data.display_name,
    preview: message.body,
    matchId: match.id,
  });

  const sent = await sendNotificationEmail(recipient.email, subject, html);
  if (sent) {
    await admin.from("notification_log").insert({
      match_id: match.id,
      recipient_id: recipientId,
      kind: "message",
    });
  }

  return NextResponse.json({ ok: true });
}
