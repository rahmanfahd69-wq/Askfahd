import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ESTIMATE_PROMPT = `You are a nutrition database. Given a food description, estimate the calories and macronutrients.
Return ONLY valid JSON in this exact format:
{
  "items": [
    { "name": "Food name", "quantity": 1, "calories": 200, "protein": 10, "carbs": 25, "fat": 8 }
  ],
  "total": { "calories": 200, "protein": 10, "carbs": 25, "fat": 8 }
}
Be accurate based on standard nutritional databases. If the description is vague, estimate based on average serving sizes.
Account for size descriptions like "big", "small", "large plate", "cup", "bowl" etc.
If multiple foods are listed, create separate items for each. No explanations, only JSON.`;

function suggestPrompt(macro: string, currentG: number, targetG: number) {
  return `A fitness client needs more ${macro} in their diet. They have consumed ${currentG}g out of their ${targetG}g daily target (${Math.round((currentG / targetG) * 100)}% met).
Suggest 4 high-${macro}, relatively low-calorie foods to help them hit their target.
Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    { "name": "Greek Yogurt (plain, 150g)", "calories": 90, "${macro}": 15 },
    { "name": "Chicken Breast (100g)", "calories": 165, "${macro}": 31 }
  ]
}
No explanations, only JSON.`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service not configured" }, { status: 500 });

    if (action === "suggest") {
      const { macro, current, target } = body as { macro: string; current: number; target: number };
      if (!macro || target == null) return NextResponse.json({ error: "macro and target required" }, { status: 400 });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: suggestPrompt(macro, current ?? 0, target),
          messages: [{ role: "user", content: `Give me 4 foods high in ${macro}.` }],
        }),
      });

      if (!res.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };
      return NextResponse.json(parsed);
    }

    // Default: estimate nutrition from description
    const { description } = body as { description: string };
    if (!description?.trim()) return NextResponse.json({ error: "description required" }, { status: 400 });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: ESTIMATE_PROMPT,
        messages: [{ role: "user", content: description.trim() }],
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI service error" }, { status: 500 });

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse nutrition data" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Nutrition API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
