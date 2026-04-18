import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientDetailTabs } from "@/components/trainer/ClientDetailTabs";
import { getInitials } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import type { Role } from "@/lib/supabase/types";

function getPTBadge(ptEndDate: string | null) {
  if (!ptEndDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(ptEndDate);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { text: "PT Expired",                 classes: "bg-red-500/10 text-red-400 border-red-500/20"     };
  if (diffDays <= 14) return { text: `PT expires in ${diffDays}d`, classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return              { text: `PT active · ${diffDays}d left`,     classes: "bg-green-500/10 text-green-400 border-green-500/20" };
}

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profileData as { role: Role } | null)?.role !== "trainer") redirect("/login");

  const [clientRes, clientProfileRes, plansRes, chatRes, foodLogsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("trainer_id, age, gender, height_cm, weight_kg, goals, activity_level, gym_access, diet_type, sleep_hours, stress_level, work_hours, injuries, notes, trainer_notes, pt_start_date, pt_end_date, is_active, updated_at")
      .eq("id", clientId)
      .eq("trainer_id", user.id)
      .single(),
    supabase.from("profiles").select("full_name, email").eq("id", clientId).single(),
    supabase
      .from("plans")
      .select("id, type, title, content, is_active, generated_by, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("food_logs")
      .select("id, date, food_description, total_calories, total_protein, total_carbs, total_fat, created_at")
      .eq("client_id", clientId)
      .order("date", { ascending: false })
      .limit(90),
  ]);

  if (!clientRes.data) notFound();

  const client        = clientRes.data;
  const clientProfile = clientProfileRes.data;
  const plans         = plansRes.data || [];
  const chatMessages  = chatRes.data || [];
  const foodLogs      = foodLogsRes.data || [];
  const clientName    = clientProfile?.full_name || "Client";
  const ptBadge       = getPTBadge(client.pt_end_date);

  // Extract nutrition targets from active plan
  const activePlan = plans.find((p) => p.is_active);
  const pc = activePlan?.content as { nutrition?: { daily_calories?: number; macros?: { protein_g?: number; carbs_g?: number; fats_g?: number } }; daily_calories?: number; macros?: { protein_g?: number; carbs_g?: number; fats_g?: number } } | null;
  const n = pc?.nutrition;
  const nutritionTargets = {
    calories: n?.daily_calories ?? pc?.daily_calories ?? null,
    protein:  n?.macros?.protein_g  ?? pc?.macros?.protein_g  ?? null,
    carbs:    n?.macros?.carbs_g    ?? pc?.macros?.carbs_g    ?? null,
    fat:      n?.macros?.fats_g     ?? pc?.macros?.fats_g     ?? null,
  };

  return (
    <div className="animate-fade-up">
      {/* Back */}
      <Link
        href="/trainer/clients"
        className="inline-flex items-center gap-1.5 text-[12px] text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.8)] transition-colors mb-6"
      >
        <ChevronLeft size={14} /> Back to clients
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <Avatar className="w-16 h-16 text-lg shrink-0">
          <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-['Syne'] font-black text-[24px]">{clientName}</h1>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              client.is_active
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {client.is_active ? "Active" : "Inactive"}
            </span>
            {ptBadge && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ptBadge.classes}`}>
                {ptBadge.text}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[rgba(255,255,255,0.4)]">{clientProfile?.email}</p>
          {(client.goals || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(client.goals as string[]).slice(0, 4).map((g) => (
                <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,87,34,0.08)] border border-[rgba(255,87,34,0.15)] text-[rgba(255,138,101,0.8)]">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ClientDetailTabs
        clientId={clientId}
        clientName={clientName}
        profile={{
          age:            client.age,
          gender:         client.gender,
          height_cm:      client.height_cm,
          weight_kg:      client.weight_kg,
          goals:          client.goals,
          activity_level: client.activity_level,
          gym_access:     client.gym_access,
          diet_type:      client.diet_type,
          injuries:       client.injuries,
          notes:          client.notes,
          trainer_notes:  client.trainer_notes,
          pt_start_date:  client.pt_start_date,
          pt_end_date:    client.pt_end_date,
        }}
        plans={plans as Parameters<typeof ClientDetailTabs>[0]["plans"]}
        chatMessages={chatMessages}
        foodLogs={foodLogs}
        nutritionTargets={nutritionTargets}
      />
    </div>
  );
}
