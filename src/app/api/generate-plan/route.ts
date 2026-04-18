import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId, planType = "full" } = await req.json();
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

    // Verify trainer owns this client
    const { data: trainer } = await supabase.from("trainers").select("id, ai_name").eq("id", user.id).single();
    if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 403 });

    const { data: client } = await supabase
      .from("clients")
      .select("trainer_id, age, gender, height_cm, weight_kg, goals, activity_level, gym_access, diet_type, sleep_hours, stress_level, work_hours, injuries, notes")
      .eq("id", clientId)
      .eq("trainer_id", user.id)
      .single();

    if (!client) return NextResponse.json({ error: "Client not found or not assigned to you" }, { status: 404 });

    const { data: clientProfile } = await supabase.from("profiles").select("full_name").eq("id", clientId).single();
    const clientName = clientProfile?.full_name || "Client";

    const prompt = buildPlanPrompt({ clientName, client, planType });

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 500 });
    }

    const result = await anthropicRes.json();
    const rawText = result.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse plan from AI response" }, { status: 500 });

    let planContent: Record<string, unknown>;
    try {
      planContent = JSON.parse(jsonMatch[1]);
    } catch {
      return NextResponse.json({ error: "Invalid plan format from AI" }, { status: 500 });
    }

    const planTitle = `${clientName}'s ${planType === "full" ? "Full" : planType === "workout" ? "Workout" : "Nutrition"} Plan`;

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .insert({
        client_id: clientId,
        trainer_id: user.id,
        type: planType,
        title: planTitle,
        content: planContent,
        is_active: true,
        generated_by: "ai",
      })
      .select("id")
      .single();

    if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

    await supabase.from("usage_events").insert({
      user_id: user.id,
      trainer_id: user.id,
      event_type: "plan_generated",
      metadata: { client_id: clientId, plan_id: plan?.id, plan_type: planType },
    });

    return NextResponse.json({ success: true, planId: plan?.id, planContent });
  } catch (err) {
    console.error("Generate plan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildPlanPrompt(opts: {
  clientName: string;
  planType: string;
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
    notes?: string | null;
  };
}): string {
  const { clientName, client, planType } = opts;
  return `Generate a professional, personalised fitness ${planType === "nutrition" ? "nutrition" : planType === "workout" ? "workout" : "full fitness"} plan for this client.

CLIENT PROFILE:
Name: ${clientName}
Age: ${client.age ?? "Unknown"}
Gender: ${client.gender ?? "Unknown"}
Height: ${client.height_cm ? `${client.height_cm} cm` : "Unknown"}
Weight: ${client.weight_kg ? `${client.weight_kg} kg` : "Unknown"}
Goals: ${client.goals?.join(", ") || "General fitness"}
Activity Level: ${client.activity_level ?? "Moderate"}
Gym Access: ${client.gym_access ?? "Full gym"}
Diet Type: ${client.diet_type ?? "No restriction"}
Sleep: ${client.sleep_hours ?? "7-8 hours"}
Stress Level: ${client.stress_level ?? "Moderate"}
Work Hours: ${client.work_hours ?? "Full-time"}
Injuries/Limitations: ${client.injuries?.length ? client.injuries.join(", ") : "None"}
Medical Notes: ${client.notes ?? "None"}

Return ONLY valid JSON in this exact structure (no other text):
${planType === "nutrition" ? `\`\`\`json
{
  "summary": "Brief overview of the nutrition plan",
  "daily_calories": 2000,
  "macros": { "protein_g": 150, "carbs_g": 200, "fats_g": 70 },
  "meals": [
    { "name": "Breakfast", "time": "7:00 AM", "foods": [{"item": "Oatmeal", "amount": "80g", "calories": 290}], "total_calories": 450 },
    { "name": "Lunch", "time": "12:30 PM", "foods": [{"item": "Grilled chicken breast", "amount": "150g", "calories": 250}], "total_calories": 650 },
    { "name": "Dinner", "time": "7:00 PM", "foods": [{"item": "Salmon fillet", "amount": "200g", "calories": 400}], "total_calories": 700 }
  ],
  "hydration": "2.5-3L water daily",
  "supplements": ["Protein powder post-workout", "Vitamin D 1000IU"],
  "tips": ["Meal prep on Sundays", "Eat within 30 min post-workout"]
}
\`\`\`` : planType === "workout" ? `\`\`\`json
{
  "summary": "Brief overview of the workout plan",
  "duration_weeks": 4,
  "frequency": "4 days/week",
  "days": [
    {
      "name": "Day 1 — Upper Body Push",
      "type": "Strength",
      "warmup": "5 min light cardio + shoulder circles",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest": "90s", "notes": "Control the descent" },
        { "name": "Overhead Press", "sets": 3, "reps": "10-12", "rest": "60s", "notes": "" }
      ],
      "cooldown": "5 min stretching"
    }
  ],
  "tips": ["Track weights each session", "Sleep 7-8 hours for recovery"]
}
\`\`\`` : `\`\`\`json
{
  "summary": "Brief overview of the full plan",
  "duration_weeks": 4,
  "workout": {
    "frequency": "4 days/week",
    "days": [
      {
        "name": "Day 1 — Upper Body Push",
        "type": "Strength",
        "warmup": "5 min light cardio",
        "exercises": [
          { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest": "90s", "notes": "" }
        ],
        "cooldown": "5 min stretching"
      }
    ]
  },
  "nutrition": {
    "daily_calories": 2000,
    "macros": { "protein_g": 150, "carbs_g": 200, "fats_g": 70 },
    "meals": [
      { "name": "Breakfast", "time": "7:00 AM", "foods": [{"item": "Oatmeal", "amount": "80g", "calories": 290}], "total_calories": 450 }
    ],
    "hydration": "2.5-3L water daily",
    "tips": ["Eat within 30 min post-workout"]
  },
  "recovery": {
    "sleep_target": "7-8 hours",
    "rest_days": ["Wednesday", "Saturday", "Sunday"],
    "tips": ["Foam roll daily", "10 min post-workout stretching"],
    "active_recovery": "Light walk or swimming on rest days"
  }
}
\`\`\``}

Be specific, realistic, and tailored to the client's profile. Never include exercises that would aggravate their injuries.`;
}
