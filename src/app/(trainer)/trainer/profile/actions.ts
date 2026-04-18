"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTrainerProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const fullName       = formData.get("full_name") as string;
  const bio            = formData.get("bio") as string;
  const photoUrl       = formData.get("photo_url") as string;
  const specialties    = (formData.get("specialties") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const whatsapp       = formData.get("whatsapp_number") as string;
  const instagram      = formData.get("instagram_handle") as string;

  const [trainerRes, profileRes] = await Promise.all([
    supabase.from("trainers").update({
      bio: bio || null,
      photo_url: photoUrl || null,
      specialties,
      whatsapp_number: whatsapp || null,
      instagram_handle: instagram || null,
    }).eq("id", user.id),
    supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id),
  ]);

  if (trainerRes.error) return { error: trainerRes.error.message };
  if (profileRes.error) return { error: profileRes.error.message };

  revalidatePath("/trainer/profile");
  return { success: true };
}
