import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, sessionId: existingSessionId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const [clientRes, profileRes] = await Promise.all([
      supabase
        .from("clients")
        .select("trainer_id, goals, injuries, notes, trainer_notes, ai_instructions, age, gender, weight_kg, height_cm, activity_level, diet_type")
        .eq("id", user.id)
        .single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ]);

    if (!clientRes.data) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const clientData = clientRes.data;
    const clientName = profileRes.data?.full_name?.split(" ")[0] || "there";

    if (!clientData.trainer_id) {
      return NextResponse.json({ error: "No trainer assigned yet. Ask admin to assign you a trainer." }, { status: 400 });
    }

    const [trainerRes, trainerProfileRes, activePlanRes] = await Promise.all([
      supabase.from("trainers").select("ai_name, ai_system_prompt, coaching_style").eq("id", clientData.trainer_id).single(),
      supabase.from("profiles").select("full_name").eq("id", clientData.trainer_id).single(),
      supabase
        .from("plans")
        .select("content, type")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const aiName = trainerRes.data?.ai_name || "Coach";
    const trainerName = trainerProfileRes.data?.full_name || "your trainer";

    // Extract macro targets from active plan
    type PlanContent = {
      nutrition?: { daily_calories?: number; macros?: { protein_g?: number; carbs_g?: number; fats_g?: number } };
      daily_calories?: number;
      macros?: { protein_g?: number; carbs_g?: number; fats_g?: number };
    };
    const pc = activePlanRes.data?.content as PlanContent | null;
    const n = pc?.nutrition;
    const macros = {
      calories: n?.daily_calories ?? pc?.daily_calories ?? null,
      protein:  n?.macros?.protein_g  ?? pc?.macros?.protein_g  ?? null,
      carbs:    n?.macros?.carbs_g    ?? pc?.macros?.carbs_g    ?? null,
      fat:      n?.macros?.fats_g     ?? pc?.macros?.fats_g     ?? null,
    };

    const systemPrompt = buildSystemPrompt({
      aiName,
      trainerName,
      trainerSystemPrompt: trainerRes.data?.ai_system_prompt,
      aiInstructions: clientData.ai_instructions,
      client: { ...clientData, full_name: profileRes.data?.full_name },
      macros,
    });

    // Create session if needed
    let sessionId = existingSessionId;
    if (!sessionId) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .insert({ client_id: user.id, trainer_id: clientData.trainer_id, title: "AI Chat" })
        .select("id")
        .single();
      sessionId = session?.id;
    }
    if (!sessionId) return NextResponse.json({ error: "Could not create session" }, { status: 500 });

    // Load recent history for context
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(30);

    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      client_id: user.id,
      role: "user",
      content: message.trim(),
    });

    const messages = [
      ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message.trim() },
    ];

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 500 });
    }

    const result = await anthropicRes.json();
    const reply = result.content?.[0]?.text || "I'm having trouble responding right now. Please try again.";
    const tokensUsed: number | null = result.usage?.output_tokens ?? null;

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      client_id: user.id,
      role: "assistant",
      content: reply,
      tokens_used: tokensUsed,
    });

    await supabase.from("usage_events").insert({
      user_id: user.id,
      trainer_id: clientData.trainer_id,
      event_type: "chat_message",
      metadata: { tokens_used: tokensUsed, session_id: sessionId },
    });

    return NextResponse.json({ reply, sessionId, aiName, clientName });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildSystemPrompt(opts: {
  aiName: string;
  trainerName: string;
  trainerSystemPrompt: string | null | undefined;
  aiInstructions: string | null | undefined;
  client: {
    full_name?: string | null;
    age?: number | null;
    gender?: string | null;
    goals?: string[];
    activity_level?: string | null;
    injuries?: string[];
    notes?: string | null;
    weight_kg?: number | null;
    height_cm?: number | null;
    diet_type?: string | null;
  };
  macros: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
}): string {
  const { aiName, trainerName, trainerSystemPrompt, aiInstructions, client, macros } = opts;
  const name = client.full_name?.split(" ")[0] || "the client";
  const trainerFirst = trainerName.split(" ")[0];

  const macroLine = macros.calories
    ? `Calories: ${macros.calories} kcal/day | Protein: ${macros.protein ?? "?"}g | Carbs: ${macros.carbs ?? "?"}g | Fat: ${macros.fat ?? "?"}g`
    : "No active plan set yet — targets not available";

  return `You are ${aiName}, a fitness coach assistant working under Coach ${trainerName}.

IMPORTANT RULES:
- You are an ASSISTANT to the trainer, NOT a replacement. Always refer to the trainer as the expert.
- NEVER give medical diagnoses or contradict the trainer's notes.
- If asked about something outside the client's plan, say "Let me check with Coach ${trainerFirst} on this."
- If ${name} mentions new pain or injury, say "Please let Coach ${trainerFirst} know about this directly."
- Only recommend exercises and foods that align with the client's assessment and trainer's notes.
- For food recommendations, focus on Kerala-specific foods (idly, dosa, puttu, appam, rice, sambar, avial, thoran, fish curry, egg curry, chicken breast, eggs, whey protein, paneer). NEVER recommend salmon, Greek yogurt, quinoa, kale, avocado, turkey, or cottage cheese unless the client's diet or location suggests these are available and appropriate.
- Keep responses practical, motivating, and concise.

CLIENT PROFILE:
Name: ${name}
Age: ${client.age ?? "Not specified"} | Gender: ${client.gender ?? "Not specified"}
Height: ${client.height_cm ? `${client.height_cm} cm` : "Not specified"} | Weight: ${client.weight_kg ? `${client.weight_kg} kg` : "Not specified"}
Goals: ${client.goals?.length ? client.goals.join(", ") : "Not specified"}
Activity Level: ${client.activity_level ?? "Not specified"}
Diet Type: ${client.diet_type ?? "Not specified"}
Injuries / Limitations: ${client.injuries?.length ? client.injuries.join(", ") : "None reported"}
Medical Notes: ${client.notes ?? "None"}

TRAINER'S NOTES ABOUT THIS CLIENT:
${aiInstructions?.trim() || "No specific instructions set by trainer."}

TRAINER'S SPECIFIC INSTRUCTIONS:
${trainerSystemPrompt?.trim() || "Follow standard coaching best practices."}

CURRENT ACTIVE PLAN:
${macroLine}

Answer ONLY based on the above information. If information is missing, say so honestly. Always recommend the client speak to Coach ${trainerFirst} for major changes to their programme.`;
}
