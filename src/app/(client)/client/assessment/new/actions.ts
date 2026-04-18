"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAssessmentData(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const age           = formData.get("age") ? Number(formData.get("age")) : null;
  const gender        = formData.get("gender") as string;
  const heightCm      = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const weightKg      = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;
  const goals         = formData.getAll("goals") as string[];
  const activityLevel = formData.get("activity_level") as string;
  const gymAccess     = formData.get("gym_access") as string;
  const dietType      = formData.get("diet_type") as string;
  const sleepHours    = formData.get("sleep_hours") as string;
  const stressLevel   = formData.get("stress_level") as string;
  const workHours     = formData.get("work_hours") as string;
  const injuries      = (formData.get("injuries") as string || "").split(",").map((s) => s.trim()).filter(Boolean);

  const answers = {
    age, gender, height_cm: heightCm, weight_kg: weightKg,
    goals, activity_level: activityLevel, gym_access: gymAccess,
    diet_type: dietType, sleep_hours: sleepHours, stress_level: stressLevel,
    work_hours: workHours, injuries,
  };

  const [clientUpdate, assessmentInsert] = await Promise.all([
    supabase.from("clients").update({
      age,
      gender: gender || null,
      height_cm: heightCm,
      weight_kg: weightKg,
      goals,
      activity_level: activityLevel || null,
      gym_access: gymAccess || null,
      diet_type: dietType || null,
      sleep_hours: sleepHours || null,
      stress_level: stressLevel || null,
      work_hours: workHours || null,
      injuries,
      onboarding_done: true,
    }).eq("id", user.id),
    supabase.from("assessments").insert({ client_id: user.id, answers }),
  ]);

  if (clientUpdate.error) return { error: clientUpdate.error.message };
  if (assessmentInsert.error) return { error: assessmentInsert.error.message };

  await supabase.from("usage_events").insert({
    user_id: user.id,
    event_type: "assessment_taken",
    metadata: answers as Record<string, unknown>,
  });

  revalidatePath("/client");
  revalidatePath("/client/plan");
  revalidatePath("/client/tracker");
  return { success: true };
}
