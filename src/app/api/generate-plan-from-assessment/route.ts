import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service not configured" }, { status: 500 });

    const [clientRes, profileRes] = await Promise.all([
      supabase
        .from("clients")
        .select("trainer_id, age, gender, height_cm, weight_kg, goals, activity_level, gym_access, diet_type, sleep_hours, stress_level, work_hours, injuries")
        .eq("id", user.id)
        .single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ]);

    if (!clientRes.data) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (!clientRes.data.trainer_id) return NextResponse.json({ error: "No trainer assigned" }, { status: 400 });

    const client = clientRes.data;
    const clientName = profileRes.data?.full_name?.trim() || "Client";

    const prompt = buildFullPlanPrompt({ clientName, client });

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Anthropic error:", errText);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text || "";

    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      console.error("Could not parse plan JSON from:", rawText.slice(0, 500));
      return NextResponse.json({ error: "Could not parse plan from AI" }, { status: 500 });
    }

    let planContent: Record<string, unknown>;
    try {
      planContent = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("JSON parse error:", e);
      return NextResponse.json({ error: "Invalid plan format from AI" }, { status: 500 });
    }

    const admin = await createAdminClient();
    const { data: plan, error: planError } = await admin
      .from("plans")
      .insert({
        client_id: user.id,
        trainer_id: client.trainer_id,
        type: "full",
        title: `${clientName}'s Personalised Plan`,
        content: planContent,
        is_active: true,
        generated_by: "ai",
      })
      .select("id")
      .single();

    if (planError) {
      console.error("Plan insert error:", planError);
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    await supabase.from("usage_events").insert({
      user_id: user.id,
      trainer_id: client.trainer_id,
      event_type: "plan_generated",
      metadata: { plan_id: plan?.id, source: "assessment" },
    });

    return NextResponse.json({ success: true, planId: plan?.id });
  } catch (err) {
    console.error("generate-plan-from-assessment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildFullPlanPrompt(opts: {
  clientName: string;
  client: {
    age?: number | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    goals?: string[];
    activity_level?: string | null;
    gym_access?: string | null;
    diet_type?: string | null;
    sleep_hours?: string | null;
    stress_level?: string | null;
    work_hours?: string | null;
    injuries?: string[];
  };
}): string {
  const { clientName, client } = opts;
  const isKerala = client.diet_type?.toLowerCase().includes("kerala") ||
                   client.diet_type?.toLowerCase().includes("vegetarian");

  return `Generate a complete personalised fitness plan for this client. Use Kerala-style foods${isKerala ? " throughout" : " where appropriate"} — idly, dosa, puttu, appam, rice, sambar, avial, thoran, fish curry, egg curry, chicken curry, chapati. NEVER suggest salmon, Greek yogurt, quinoa, kale, avocado, or turkey.

CLIENT PROFILE:
Name: ${clientName}
Age: ${client.age ?? "Not specified"}
Gender: ${client.gender ?? "Not specified"}
Height: ${client.height_cm ? `${client.height_cm} cm` : "Not specified"}
Weight: ${client.weight_kg ? `${client.weight_kg} kg` : "Not specified"}
Goals: ${client.goals?.join(", ") || "General fitness"}
Activity Level: ${client.activity_level ?? "Moderately active"}
Gym Access: ${client.gym_access ?? "Full gym"}
Diet Type: ${client.diet_type ?? "No restriction"}
Sleep: ${client.sleep_hours ?? "7-8 hours"}
Stress Level: ${client.stress_level ?? "Moderate"}
Work Hours: ${client.work_hours ?? "Full-time"}
Injuries/Limitations: ${client.injuries?.length ? client.injuries.join(", ") : "None"}

Return ONLY valid JSON in this exact structure:
\`\`\`json
{
  "summary": "Brief 2-sentence overview of the plan",
  "duration_weeks": 4,
  "workout": {
    "frequency": "4 days/week",
    "days": [
      {
        "name": "Day 1 — Upper Body Push",
        "type": "Strength",
        "warmup": "5 min light cardio",
        "exercises": [
          { "name": "Push-ups", "sets": 4, "reps": "12-15", "rest": "60s", "notes": "Keep core tight" }
        ],
        "cooldown": "5 min stretching"
      }
    ]
  },
  "nutrition": {
    "daily_calories": 2000,
    "macros": { "protein_g": 150, "carbs_g": 200, "fats_g": 70 },
    "meals": [
      { "name": "Breakfast", "time": "7:30 AM", "foods": [{"item": "Puttu + Kadala curry", "amount": "2 pieces + 1 cup", "calories": 420}], "total_calories": 450 },
      { "name": "Lunch", "time": "1:00 PM", "foods": [{"item": "Rice + Fish curry + Thoran", "amount": "2 cups + 1 cup + half cup", "calories": 650}], "total_calories": 700 },
      { "name": "Snack", "time": "4:30 PM", "foods": [{"item": "Boiled eggs", "amount": "2 nos", "calories": 140}], "total_calories": 200 },
      { "name": "Dinner", "time": "7:30 PM", "foods": [{"item": "Chapati + Egg curry", "amount": "3 pieces + 1 cup", "calories": 520}], "total_calories": 600 }
    ],
    "hydration": "2.5-3L water daily",
    "tips": ["Eat within 30 min post-workout", "Have protein in every meal"]
  },
  "recovery": {
    "sleep_target": "7-8 hours",
    "rest_days": ["Wednesday", "Saturday", "Sunday"],
    "tips": ["Foam roll daily", "10 min post-workout stretching"],
    "active_recovery": "Light walk on rest days"
  }
}
\`\`\`

Be specific, realistic, and tailored to the client. Never include exercises that worsen their injuries.`;
}
