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
        .select("trainer_id, goals, injuries, notes, age, gender, weight_kg, height_cm, activity_level, diet_type")
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

    const [trainerRes, trainerProfileRes] = await Promise.all([
      supabase.from("trainers").select("ai_name, ai_system_prompt, coaching_style").eq("id", clientData.trainer_id).single(),
      supabase.from("profiles").select("full_name").eq("id", clientData.trainer_id).single(),
    ]);

    const aiName = trainerRes.data?.ai_name || "Coach";
    const trainerName = trainerProfileRes.data?.full_name || "your trainer";

    const systemPrompt = buildSystemPrompt({
      aiName,
      trainerName,
      trainerSystemPrompt: trainerRes.data?.ai_system_prompt,
      coachingStyle: trainerRes.data?.coaching_style,
      client: { ...clientData, full_name: profileRes.data?.full_name },
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
  coachingStyle: string | null | undefined;
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
}): string {
  const { aiName, trainerName, trainerSystemPrompt, coachingStyle, client } = opts;
  const name = client.full_name?.split(" ")[0] || "the client";

  return `You are ${aiName}, a personal AI fitness coach for ${name}.
${trainerSystemPrompt ? `\nTRAINER INSTRUCTIONS:\n${trainerSystemPrompt}\n` : ""}${coachingStyle ? `\nCOACHING STYLE: ${coachingStyle}\n` : ""}
CLIENT PROFILE:
- Name: ${name}
- Age: ${client.age ?? "Not specified"}
- Gender: ${client.gender ?? "Not specified"}
- Weight: ${client.weight_kg ? `${client.weight_kg} kg` : "Not specified"}
- Height: ${client.height_cm ? `${client.height_cm} cm` : "Not specified"}
- Goals: ${client.goals?.length ? client.goals.join(", ") : "Not specified"}
- Activity level: ${client.activity_level ?? "Not specified"}
- Diet type: ${client.diet_type ?? "Not specified"}
- Injuries/Limitations: ${client.injuries?.length ? client.injuries.join(", ") : "None"}
- Medical notes: ${client.notes ?? "None"}

MANDATORY GUARDRAILS — never break these:
1. You are NOT a medical professional. Never diagnose, prescribe, or replace professional medical advice.
2. If ${name} mentions any new injury, pain, or health concern, respond: "I've noted this — please discuss directly with ${trainerName} before we continue with this area." Then offer to work on unaffected areas.
3. Only recommend exercises and nutrition consistent with the profile above, especially existing injuries.
4. When giving specific advice based on their data, say "Based on your profile and current plan, ..."
5. Always encourage consulting ${trainerName} for significant program changes.
6. Keep responses practical, motivating, and focused on their goals. Be concise.`;
}
