"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireModerator() {
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) throw new Error("Sign in is required.");

  const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
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
      .update({ is_quarantined: false })
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
      .update({ is_quarantined: true })
      .eq("id", reportedId);

  if (profileError) throw new Error(profileError.message);
    revalidatePath("/admin/moderation");
}
