"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClientForTrainer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const goals    = (formData.get("goals") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const injuries = (formData.get("injuries") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const notes    = (formData.get("notes") as string) || null;
  const ptStart  = (formData.get("pt_start_date") as string) || null;
  const ptEnd    = (formData.get("pt_end_date") as string) || null;
  const age      = formData.get("age") ? Number(formData.get("age")) : null;
  const gender   = (formData.get("gender") as string) || null;
  const heightCm = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const weightKg = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;

  if (!email || !password || !fullName) return { error: "Name, email, and password are required." };

  const admin = createAdminClient();

  // 1. Create auth user
  const { data, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "client" },
  });
  if (authError) {
    console.error("[createClientForTrainer] auth.createUser error:", authError);
    return { error: authError.message };
  }

  const clientId = data.user.id;

  // 2. Upsert profiles row — the trigger creates it, upsert ensures correct name if trigger raced
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: clientId, role: "client", full_name: fullName, email }, { onConflict: "id" });
  if (profileError) {
    console.error("[createClientForTrainer] profiles upsert error:", profileError);
    return { error: profileError.message };
  }

  // 3. Upsert clients row — trigger creates (id) only; we need to set trainer_id + all details
  const { error: clientError } = await admin
    .from("clients")
    .upsert({
      id: clientId,
      trainer_id: user.id,
      goals,
      injuries,
      notes,
      pt_start_date: ptStart,
      pt_end_date: ptEnd,
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
    }, { onConflict: "id" });
  if (clientError) {
    console.error("[createClientForTrainer] clients upsert error:", clientError);
    return { error: clientError.message };
  }

  revalidatePath("/trainer/clients");
  return { success: true };
}

export async function updateClientProfile(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const goals             = (formData.get("goals") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const injuries          = (formData.get("injuries") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const age               = formData.get("age") ? Number(formData.get("age")) : null;
  const gender            = formData.get("gender") as string;
  const heightCm          = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const weightKg          = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;
  const activityLevel     = formData.get("activity_level") as string;
  const gymAccess         = formData.get("gym_access") as string;
  const dietType          = formData.get("diet_type") as string;
  const notes             = formData.get("notes") as string;
  const ptStart           = formData.get("pt_start_date") as string;
  const ptEnd             = formData.get("pt_end_date") as string;
  const requirements      = formData.get("requirements") as string;
  const medicalConditions = formData.get("medical_conditions") as string;
  const medications       = formData.get("medications") as string;
  const allergies         = formData.get("allergies") as string;
  const aiInstructions    = formData.get("ai_instructions") as string;

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
      requirements: requirements || null,
      medical_conditions: medicalConditions || null,
      medications: medications || null,
      allergies: allergies || null,
      ai_instructions: aiInstructions || null,
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
