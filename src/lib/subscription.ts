import { createClient } from "@/lib/supabase/server";

// Returns true if the given (or currently logged-in) user has an active
// or trialing Plus subscription. AI routes gate on this.
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.status === "active" || data?.status === "trialing";
}
