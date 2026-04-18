"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAISettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const aiName         = formData.get("ai_name") as string;
  const coachingStyle  = formData.get("coaching_style") as string;
  const aiSystemPrompt = formData.get("ai_system_prompt") as string;

  const { error } = await supabase
    .from("trainers")
    .update({
      ai_name: aiName || "Coach",
      coaching_style: coachingStyle || null,
      ai_system_prompt: aiSystemPrompt || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/trainer/ai-settings");
  return { success: true };
}
