import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AISettingsForm } from "@/components/trainer/AISettingsForm";
import type { Role } from "@/lib/supabase/types";
import { ShieldCheck } from "lucide-react";

export default async function AISettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profileData as { role: Role } | null)?.role !== "trainer") redirect("/login");

  const { data: trainer } = await supabase
    .from("trainers")
    .select("ai_name, coaching_style, ai_system_prompt")
    .eq("id", user.id)
    .single();

  return (
    <div className="animate-fade-up space-y-7 max-w-2xl">
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          Customise
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(24px,3vw,36px)] leading-tight">
          AI Coach Settings
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-2">
          Define your AI coach&apos;s name, personality, and coaching style.
        </p>
      </div>

      <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.07)] rounded-[14px] px-5 py-4 flex items-start gap-3">
        <ShieldCheck size={16} className="text-green-400 shrink-0 mt-0.5" />
        <p className="text-[13px] text-[rgba(255,255,255,0.5)] leading-relaxed">
          Platform safety guardrails always remain active. Your AI will never provide medical diagnoses or advice that contradicts injury/health notes on record.
        </p>
      </div>

      <AISettingsForm
        aiName={trainer?.ai_name || "Coach"}
        coachingStyle={trainer?.coaching_style || null}
        aiSystemPrompt={trainer?.ai_system_prompt || null}
      />
    </div>
  );
}
