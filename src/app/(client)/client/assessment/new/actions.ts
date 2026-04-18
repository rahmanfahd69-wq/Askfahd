"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitAssessment(formData: FormData) {
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

  // Save assessment data + mark onboarding done
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
    supabase.from("assessments").insert({ client_id: user.id, answers }).select("id").single(),
  ]);

  if (clientUpdate.error) return { error: clientUpdate.error.message };
  if (assessmentInsert.error) return { error: assessmentInsert.error.message };

  const assessmentId = assessmentInsert.data?.id;

  // Auto-generate nutrition plan if client has a trainer assigned
  try {
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("trainer_id")
      .eq("id", user.id)
      .single();

    if (clientRecord?.trainer_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const clientName = profileData?.full_name || "Client";

      const prompt = buildNutritionPrompt({
        clientName,
        age, gender, heightCm, weightKg,
        goals, activityLevel, gymAccess, dietType,
        sleepHours, stressLevel, workHours, injuries,
      });

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const rawText = aiData.content?.[0]?.text || "";
        const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          const planContent = JSON.parse(jsonMatch[1]);
          const admin = await createAdminClient();
          const { data: plan } = await admin
            .from("plans")
            .insert({
              client_id: user.id,
              trainer_id: clientRecord.trainer_id,
              type: "nutrition",
              title: `${clientName}'s Nutrition Plan`,
              content: planContent,
              is_active: true,
              generated_by: "ai",
            })
            .select("id")
            .single();

          // Link plan to assessment
          if (plan && assessmentId) {
            await admin
              .from("assessments")
              .update({ plan_id: plan.id })
              .eq("id", assessmentId);
          }
        }
      }
    }
  } catch {
    // Plan generation failure should not block assessment completion
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    event_type: "assessment_taken",
    metadata: answers as Record<string, unknown>,
  });

  revalidatePath("/client");
  revalidatePath("/client/plan");
  revalidatePath("/client/tracker");
  redirect("/client/plan");
}

function buildNutritionPrompt(opts: {
  clientName: string;
  age: number | null;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  goals: string[];
  activityLevel: string;
  gymAccess: string;
  dietType: string;
  sleepHours: string;
  stressLevel: string;
  workHours: string;
  injuries: string[];
}): string {
  const { clientName, age, gender, heightCm, weightKg, goals, activityLevel, dietType, injuries } = opts;
  const isKerala = dietType?.toLowerCase().includes("kerala") || dietType?.toLowerCase().includes("vegetarian");

  return `Generate a personalised daily nutrition plan for this client. Use Kerala-style foods${isKerala ? " exclusively" : " where appropriate"} (idly, dosa, puttu, appam, rice, sambar, avial, thoran, fish curry, egg curry, chicken curry, chapati). Avoid salmon, Greek yogurt, quinoa, kale unless specifically requested.

CLIENT:
Name: ${clientName}
Age: ${age ?? "Not specified"}
Gender: ${gender || "Not specified"}
Height: ${heightCm ? `${heightCm} cm` : "Not specified"}
Weight: ${weightKg ? `${weightKg} kg` : "Not specified"}
Goals: ${goals.join(", ") || "General fitness"}
Activity Level: ${activityLevel || "Moderately active"}
Diet Type: ${dietType || "No restriction"}
Injuries: ${injuries.join(", ") || "None"}

Return ONLY valid JSON:
\`\`\`json
{
  "summary": "Brief overview",
  "daily_calories": 2000,
  "macros": { "protein_g": 150, "carbs_g": 200, "fats_g": 70 },
  "meals": [
    { "name": "Breakfast", "time": "7:30 AM", "foods": [{"item": "Puttu + Kadala curry", "amount": "2 pieces + 1 cup", "calories": 380}], "total_calories": 450 },
    { "name": "Lunch", "time": "1:00 PM", "foods": [{"item": "Rice + Fish curry + Thoran", "amount": "2 cups + 1 cup + half cup", "calories": 620}], "total_calories": 700 },
    { "name": "Dinner", "time": "7:30 PM", "foods": [{"item": "Chapati + Egg curry", "amount": "3 pieces + 1 cup", "calories": 480}], "total_calories": 550 }
  ],
  "hydration": "2.5-3L water daily",
  "tips": ["Eat within 30 min post-workout"]
}
\`\`\``;
}
