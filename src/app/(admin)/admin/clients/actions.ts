"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClient_(formData: FormData) {
  const email     = formData.get("email") as string;
  const password  = formData.get("password") as string;
  const fullName  = formData.get("full_name") as string;
  const trainerId = formData.get("trainer_id") as string;

  if (!email || !password || !fullName) {
    return { error: "Name, email and password are required." };
  }

  const admin = await createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "client" },
  });

  if (error) return { error: error.message };

  // Assign trainer if provided
  if (trainerId) {
    const { error: updateError } = await admin
      .from("clients")
      .update({ trainer_id: trainerId })
      .eq("id", data.user.id);
    if (updateError) return { error: updateError.message };
  }

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function assignTrainer(clientId: string, trainerId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ trainer_id: trainerId || null })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { success: true };
}

export async function toggleClientActive(clientId: string, isActive: boolean) {
  const supabase = await createClient();
  const [clientRes, profileRes] = await Promise.all([
    supabase.from("clients").update({ is_active: isActive }).eq("id", clientId),
    supabase.from("profiles").update({ is_active: isActive }).eq("id", clientId),
  ]);

  if (clientRes.error) return { error: clientRes.error.message };
  if (profileRes.error) return { error: profileRes.error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { success: true };
}
