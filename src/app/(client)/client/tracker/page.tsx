import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FoodTracker } from "@/components/client/FoodTracker";
import type { Role } from "@/lib/supabase/types";

interface PlanContent {
  nutrition?: { daily_calories?: number; macros?: { protein_g?: number; carbs_g?: number; fats_g?: number } };
  daily_calories?: number;
  macros?: { protein_g?: number; carbs_g?: number; fats_g?: number };
}

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profileData as { role: Role } | null)?.role !== "client") redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [clientRes, planRes, logsRes] = await Promise.all([
    supabase.from("clients").select("onboarding_done").eq("id", user.id).single(),
    supabase
      .from("plans")
      .select("content")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select("*")
      .eq("client_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true }),
  ]);

  const onboardingDone = clientRes.data?.onboarding_done;
  const planContent = planRes.data?.content as PlanContent | null;
  const n = planContent?.nutrition;
  const targets = planContent ? {
    calories: n?.daily_calories ?? planContent.daily_calories ?? null,
    protein:  n?.macros?.protein_g  ?? planContent.macros?.protein_g  ?? null,
    carbs:    n?.macros?.carbs_g    ?? planContent.macros?.carbs_g    ?? null,
    fat:      n?.macros?.fats_g     ?? planContent.macros?.fats_g     ?? null,
  } : { calories: null, protein: null, carbs: null, fat: null };

  if (!onboardingDone) {
    return (
      <div className="animate-fade-up space-y-6 max-w-lg">
        <div>
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">Food Tracker</p>
          <h1 className="font-['Syne'] font-black text-[clamp(24px,4vw,36px)] leading-tight">Daily Log</h1>
        </div>
        <div className="bg-[rgba(255,87,34,0.06)] border border-[rgba(255,87,34,0.2)] rounded-[14px] p-6 text-center">
          <p className="font-['Syne'] font-bold text-[15px] text-[#FF8A65] mb-2">Complete your assessment first</p>
          <p className="text-[13px] text-[rgba(255,255,255,0.45)] mb-5">
            Your nutrition targets will be set once you complete your assessment.
          </p>
          <Link
            href="/client/assessment/new"
            className="inline-flex bg-[#FF5722] text-white font-['Syne'] font-bold text-[13px] px-5 py-3 rounded-[10px] hover:bg-[#FF8A65] transition-colors"
          >
            Complete Assessment →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FoodTracker
      today={today}
      initialLogs={(logsRes.data || []) as Parameters<typeof FoodTracker>[0]["initialLogs"]}
      targets={targets}
    />
  );
}
