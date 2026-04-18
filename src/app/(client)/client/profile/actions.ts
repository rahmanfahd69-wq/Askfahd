"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const weightKg     = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;
  const heightCm     = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const age          = formData.get("age") ? Number(formData.get("age")) : null;
  const gender       = formData.get("gender") as string;
  const goals        = (formData.get("goals") as string || "").split(",").map((s) => s.trim()).filter(Boolean);
  const activityLevel = formData.get("activity_level") as string;
  const dietType     = formData.get("diet_type") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      weight_kg: weightKg,
      height_cm: heightCm,
      age,
      gender: gender || null,
      goals,
      activity_level: activityLevel || null,
      diet_type: dietType || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/client/profile");
  revalidatePath("/client");
  return { success: true };
}
