"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTrainer(formData: FormData) {
  const email         = formData.get("email") as string;
  const password      = formData.get("password") as string;
  const fullName      = formData.get("full_name") as string;
  const bio           = formData.get("bio") as string;
  const coachingStyle = formData.get("coaching_style") as string;
  const specialties   = (formData.get("specialties") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (!email || !password || !fullName) {
    return { error: "Name, email and password are required." };
  }

  const admin = await createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "trainer" },
  });

  if (error) return { error: error.message };

  // Trigger created profiles + trainers rows — now update the branding fields
  const { error: updateError } = await admin
    .from("trainers")
    .update({ bio, coaching_style: coachingStyle, specialties })
    .eq("id", data.user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/trainers");
  return { success: true };
}

export async function updateTrainer(trainerId: string, formData: FormData) {
  const supabase      = await createClient();
  const fullName      = formData.get("full_name") as string;
  const bio           = formData.get("bio") as string;
  const coachingStyle = formData.get("coaching_style") as string;
  const aiName        = formData.get("ai_name") as string;
  const aiPrompt      = formData.get("ai_system_prompt") as string;
  const photoUrl      = formData.get("photo_url") as string;
  const whatsapp      = formData.get("whatsapp_number") as string;
  const instagram     = formData.get("instagram_handle") as string;
  const specialties   = (formData.get("specialties") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);

  const [trainerRes, profileRes] = await Promise.all([
    supabase.from("trainers").update({
      bio,
      coaching_style: coachingStyle,
      ai_name: aiName || "Coach",
      ai_system_prompt: aiPrompt,
      photo_url: photoUrl || null,
      whatsapp_number: whatsapp || null,
      instagram_handle: instagram || null,
      specialties,
    }).eq("id", trainerId),
    supabase.from("profiles").update({ full_name: fullName }).eq("id", trainerId),
  ]);

  if (trainerRes.error) return { error: trainerRes.error.message };
  if (profileRes.error) return { error: profileRes.error.message };

  revalidatePath(`/admin/trainers/${trainerId}`);
  revalidatePath("/admin/trainers");
  return { success: true };
}
