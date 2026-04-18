"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClientForTrainer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const email       = formData.get("email") as string;
  const password    = formData.get("password") as string;
  const fullName    = formData.get("full_name") as string;
  const goals       = (formData.get("goals") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const injuries    = (formData.get("injuries") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const notes       = formData.get("notes") as string;
  const ptStart     = formData.get("pt_start_date") as string;
  const ptEnd       = formData.get("pt_end_date") as string;

  if (!email || !password || !fullName) return { error: "Name, email, and password are required." };

  const admin = await createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "client" },
  });
  if (error) return { error: error.message };

  const { error: updateError } = await admin
    .from("clients")
    .update({
      trainer_id: user.id,
      goals,
      injuries,
      notes: notes || null,
      pt_start_date: ptStart || null,
      pt_end_date: ptEnd || null,
    })
    .eq("id", data.user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/trainer/clients");
  return { success: true };
}

export async function updateClientProfile(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const goals        = (formData.get("goals") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const injuries     = (formData.get("injuries") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const age          = formData.get("age") ? Number(formData.get("age")) : null;
  const gender       = formData.get("gender") as string;
  const heightCm     = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const weightKg     = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;
  const activityLevel = formData.get("activity_level") as string;
  const gymAccess    = formData.get("gym_access") as string;
  const dietType     = formData.get("diet_type") as string;
  const notes        = formData.get("notes") as string;
  const ptStart      = formData.get("pt_start_date") as string;
  const ptEnd        = formData.get("pt_end_date") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      goals,
      injuries,
      age,
      gender: gender || null,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activityLevel || null,
      gym_access: gymAccess || null,
      diet_type: dietType || null,
      notes: notes || null,
      pt_start_date: ptStart || null,
      pt_end_date: ptEnd || null,
    })
    .eq("id", clientId)
    .eq("trainer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/trainer/clients/${clientId}`);
  return { success: true };
}

export async function updateTrainerNotes(clientId: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("clients")
    .update({ trainer_notes: notes })
    .eq("id", clientId)
    .eq("trainer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/trainer/clients/${clientId}`);
  return { success: true };
}
