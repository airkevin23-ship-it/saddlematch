import { createClient } from "@/lib/supabase/server";

// Returns true if the given (or currently logged-in) user has an active
// or trialing Plus subscription. AI routes gate on this.
//
// The admin account always passes. Every Anthropic call in the app sits behind
// this gate, so without a bypass there is no way to exercise the AI features at
// all until somebody actually pays, which makes a deploy with a valid API key
// indistinguishable from one with no key. The check is deliberately scoped to
// the logged-in user, so it can only ever grant access to the current admin
// session and never to a userId passed in from elsewhere.
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === userId && user.email?.trim().toLowerCase() === adminEmail) {
      return true;
    }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.status === "active" || data?.status === "trialing";
}
