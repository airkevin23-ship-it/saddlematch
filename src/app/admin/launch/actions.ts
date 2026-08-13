"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) throw new Error("Sign in is required.");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    throw new Error("You are not authorized to change launch settings.");
  }
}

export async function launchNow() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("launch_settings")
    .update({ is_launched: true, launched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/launch");
}

export async function revertToPreLaunch() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("launch_settings")
    .update({ is_launched: false, launched_at: null, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/launch");
}

export async function updateTarget(formData: FormData) {
  await requireAdmin();
  const raw = formData.get("target_member_count");
  const target = Number(raw);
  if (!Number.isFinite(target) || target < 1) {
    throw new Error("Target must be a positive number.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("launch_settings")
    .update({ target_member_count: Math.round(target), updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/launch");
}
