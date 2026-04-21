import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  const [planRes, logsRes] = await Promise.all([
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

  const planContent = planRes.data?.content as PlanContent | null;
  const n = planContent?.nutrition;
  const targets = planContent ? {
    calories: n?.daily_calories ?? planContent.daily_calories ?? null,
    protein:  n?.macros?.protein_g  ?? planContent.macros?.protein_g  ?? null,
    carbs:    n?.macros?.carbs_g    ?? planContent.macros?.carbs_g    ?? null,
    fat:      n?.macros?.fats_g     ?? planContent.macros?.fats_g     ?? null,
  } : { calories: null, protein: null, carbs: null, fat: null };

  return (
    <FoodTracker
      today={today}
      initialLogs={(logsRes.data || []) as Parameters<typeof FoodTracker>[0]["initialLogs"]}
      targets={targets}
    />
  );
}
