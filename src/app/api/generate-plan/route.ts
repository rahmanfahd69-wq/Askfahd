import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId, planType = "full" } = await req.json();
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

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

    const planContent = await generatePlanWithRetry({ clientName, client, planType });

    if (!planContent) {
      return NextResponse.json({ error: "AI returned an unreadable response. Please try again." }, { status: 500 });
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

async function callAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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

  if (!res.ok) {
    const err = await res.text();
    console.error("[generate-plan] Anthropic HTTP error:", err);
    throw new Error("AI service error");
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function extractJson(rawText: string): Record<string, unknown> | null {
  const trimmed = rawText.trim();

  // 1. Direct parse (model returned raw JSON as instructed)
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }

  // 2. Strip code fences if present: ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch { /* fall through */ }
  }

  // 3. Extract the outermost { ... } block
  const braceStart = trimmed.indexOf("{");
  const braceEnd   = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(trimmed.slice(braceStart, braceEnd + 1));
    } catch { /* fall through */ }
  }

  return null;
}

async function generatePlanWithRetry(opts: {
  clientName: string;
  planType: string;
  client: Record<string, unknown>;
}): Promise<Record<string, unknown> | null> {
  const { clientName, client, planType } = opts;

  // First attempt — detailed prompt
  const firstPrompt = buildPlanPrompt({ clientName, client, planType });
  const firstRaw = await callAI(firstPrompt);
  const firstResult = extractJson(firstRaw);

  if (firstResult) return firstResult;

  // Parsing failed — log what we got and retry with a stricter prompt
  console.error("[generate-plan] First attempt parse failed. Raw response (first 1000 chars):", firstRaw.slice(0, 1000));

  const retryPrompt = buildRetryPrompt({ clientName, client, planType });
  const retryRaw = await callAI(retryPrompt);
  const retryResult = extractJson(retryRaw);

  if (!retryResult) {
    console.error("[generate-plan] Retry also failed. Raw response (first 1000 chars):", retryRaw.slice(0, 1000));
  }

  return retryResult;
}

function buildRetryPrompt(opts: { clientName: string; planType: string; client: Record<string, unknown> }): string {
  const { clientName, client, planType } = opts;
  const schema = getPlanSchema(planType);
  return `You must respond with ONLY a valid JSON object. No text before it, no text after it, no markdown, no code fences, no explanation. Just the raw JSON.

Generate a ${planType} fitness plan for ${clientName} (${client.age ?? "?"}yo ${client.gender ?? ""}, goals: ${Array.isArray(client.goals) ? client.goals.join(", ") : client.goals ?? "general fitness"}).

Use this exact schema:
${schema}`;
}

function buildPlanPrompt(opts: {
  clientName: string;
  planType: string;
  client: Record<string, unknown>;
}): string {
  const { clientName, client, planType } = opts;
  const schema = getPlanSchema(planType);

  return `Generate a professional, personalised fitness ${planType === "nutrition" ? "nutrition" : planType === "workout" ? "workout" : "full fitness"} plan for this client.

IMPORTANT: Your entire response must be a single raw JSON object. Do NOT wrap it in code fences. Do NOT add any text before or after the JSON. Output ONLY the JSON object itself.

CLIENT PROFILE:
Name: ${clientName}
Age: ${client.age ?? "Unknown"}
Gender: ${client.gender ?? "Unknown"}
Height: ${client.height_cm ? `${client.height_cm} cm` : "Unknown"}
Weight: ${client.weight_kg ? `${client.weight_kg} kg` : "Unknown"}
Goals: ${Array.isArray(client.goals) ? client.goals.join(", ") : client.goals || "General fitness"}
Activity Level: ${client.activity_level ?? "Moderate"}
Gym Access: ${client.gym_access ?? "Full gym"}
Diet Type: ${client.diet_type ?? "No restriction"}
Sleep: ${client.sleep_hours ?? "7-8 hours"}
Stress Level: ${client.stress_level ?? "Moderate"}
Work Hours: ${client.work_hours ?? "Full-time"}
Injuries/Limitations: ${Array.isArray(client.injuries) && client.injuries.length ? client.injuries.join(", ") : "None"}
Medical Notes: ${client.notes ?? "None"}

JSON SCHEMA TO FOLLOW EXACTLY:
${schema}

Remember: raw JSON only. No markdown. No code fences. No explanation. Never include exercises that aggravate injuries.`;
}

function getPlanSchema(planType: string): string {
  if (planType === "nutrition") {
    return `{
  "summary": "Brief overview of the nutrition plan",
  "daily_calories": 2000,
  "macros": { "protein_g": 150, "carbs_g": 200, "fats_g": 70 },
  "meals": [
    { "name": "Breakfast", "time": "7:00 AM", "foods": [{"item": "Oatmeal", "amount": "80g", "calories": 290}], "total_calories": 450 },
    { "name": "Lunch", "time": "12:30 PM", "foods": [{"item": "Chicken breast", "amount": "150g", "calories": 250}], "total_calories": 650 },
    { "name": "Dinner", "time": "7:00 PM", "foods": [{"item": "Rice and dal", "amount": "200g", "calories": 400}], "total_calories": 700 }
  ],
  "hydration": "2.5-3L water daily",
  "supplements": ["Protein powder post-workout"],
  "tips": ["Meal prep on Sundays", "Eat within 30 min post-workout"]
}`;
  }

  if (planType === "workout") {
    return `{
  "summary": "Brief overview of the workout plan",
  "duration_weeks": 4,
  "frequency": "4 days/week",
  "days": [
    {
      "name": "Day 1 — Upper Body Push",
      "type": "Strength",
      "warmup": "5 min light cardio + shoulder circles",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest": "90s", "notes": "Control the descent" }
      ],
      "cooldown": "5 min stretching"
    }
  ],
  "tips": ["Track weights each session", "Sleep 7-8 hours for recovery"]
}`;
  }

  // full
  return `{
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
    "active_recovery": "Light walk on rest days"
  }
}`;
}
