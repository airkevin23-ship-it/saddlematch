import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchEmail } from "@/lib/notification-emails";
import { getNotifiableUser, sendNotificationEmail } from "@/lib/notify";

// Called by the client right after it detects a fresh mutual match (matches
// are actually created by a DB trigger on reciprocal likes, so the client
// can't create this row itself — it can only ask us to notify about one it
// just observed). We re-verify the match and the caller's membership in it
// with the admin client before sending anything, so a forged matchId can't
// be used to email an arbitrary pair of users.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await request.json().catch(() => ({}));
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: match } = await admin
    .from("matches")
    .select("id, user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  // Notify the *other* member — the caller already knows they matched
  // because they're the one who just triggered it client-side.
  const [recipient, self] = await Promise.all([
    getNotifiableUser(admin, otherId, "matches"),
    admin.from("profiles").select("display_name").eq("id", user.id).single(),
  ]);

  if (recipient && self.data) {
    const { subject, html } = matchEmail({
      recipientName: recipient.displayName,
      otherName: self.data.display_name,
      matchId: match.id,
    });
    await sendNotificationEmail(recipient.email, subject, html);
  }

  return NextResponse.json({ ok: true });
}
