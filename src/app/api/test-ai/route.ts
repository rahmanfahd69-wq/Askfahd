import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const [trainerRes, profileRes] = await Promise.all([
      supabase.from("trainers").select("ai_name, ai_system_prompt, coaching_style").eq("id", user.id).single(),
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    ]);

    if (profileRes.data?.role !== "trainer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const aiName = trainerRes.data?.ai_name || "Coach";
    const systemPrompt = `You are ${aiName}, a personal AI fitness coach.
${trainerRes.data?.ai_system_prompt ? `\nCOACHING PERSONALITY:\n${trainerRes.data.ai_system_prompt}\n` : ""}${trainerRes.data?.coaching_style ? `\nCOACHING STYLE: ${trainerRes.data.coaching_style}\n` : ""}
This is a preview/test — respond as you would to a real client. Be helpful, motivating, and professional.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: message.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      return NextResponse.json({ error: "AI service error. Check your API key." }, { status: 500 });
    }

    const result = await anthropicRes.json();
    const reply = result.content?.[0]?.text || "No response.";

    return NextResponse.json({ reply, aiName });
  } catch (err) {
    console.error("Test AI error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
