"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireModerator() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) throw new Error("Sign in is required.");

  const { data: profile, error } = await session
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    throw new Error("You are not authorized to moderate reports.");
  }
}

export async function dismissReports(reportedId: string) {
  await requireModerator();
  const supabase = createAdminClient();

  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: "dismissed" })
    .eq("reported_id", reportedId)
    .eq("status", "open");

  if (reportError) throw new Error(reportError.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_visible: true })
    .eq("id", reportedId);

  if (profileError) throw new Error(profileError.message);
  revalidatePath("/admin/moderation");
}

export async function actionReport(reportedId: string) {
  await requireModerator();
  const supabase = createAdminClient();

  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: "actioned" })
    .eq("reported_id", reportedId)
    .eq("status", "open");

  if (reportError) throw new Error(reportError.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_visible: false })
    .eq("id", reportedId);

  if (profileError) throw new Error(profileError.message);
  revalidatePath("/admin/moderation");
}
