import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, ClipboardList, User, Phone, AtSign, MessageCircle, ChevronRight, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";

interface PlanContent {
  workout?: { days?: Array<{ name: string; exercises?: unknown[] }> };
  days?: Array<{ name: string; exercises?: unknown[] }>;
  nutrition?: { daily_calories?: number; macros?: { protein_g?: number; carbs_g?: number; fats_g?: number } };
  daily_calories?: number;
  macros?: { protein_g?: number; carbs_g?: number; fats_g?: number };
}

function getTodayWorkout(content: PlanContent) {
  const days = content.workout?.days || content.days || [];
  if (!days.length) return null;
  const dow = new Date().getDay(); // 0=Sun … 6=Sat → map Mon=0 … Sun=6
  const idx = dow === 0 ? 6 : dow - 1;
  const day = days[idx % days.length];
  return day ? { name: day.name, exercises: day.exercises?.length ?? 0 } : null;
}

function getMacros(content: PlanContent) {
  const n = content.nutrition;
  return {
    calories: n?.daily_calories ?? content.daily_calories ?? null,
    protein:  n?.macros?.protein_g ?? content.macros?.protein_g ?? null,
    carbs:    n?.macros?.carbs_g   ?? content.macros?.carbs_g   ?? null,
    fats:     n?.macros?.fats_g    ?? content.macros?.fats_g    ?? null,
  };
}

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { full_name: string; role: Role } | null;
  if (profile?.role !== "client") redirect("/login");

  const [clientRes, planRes] = await Promise.all([
    supabase
      .from("clients")
      .select("trainer_id, onboarding_done, goals, pt_end_date")
      .eq("id", user.id)
      .single(),
    supabase
      .from("plans")
      .select("title, type, content, created_at")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const clientData = clientRes.data;
  const activePlan = planRes.data;

  let trainerName: string | null     = null;
  let trainerPhoto: string | null    = null;
  let trainerWhatsapp: string | null = null;
  let trainerInsta: string | null    = null;
  let trainerSpecs: string[]         = [];

  if (clientData?.trainer_id) {
    const [tp, tt] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", clientData.trainer_id).single(),
      supabase.from("trainers").select("photo_url, whatsapp_number, instagram_handle, specialties").eq("id", clientData.trainer_id).single(),
    ]);
    trainerName     = tp.data?.full_name || null;
    trainerPhoto    = tt.data?.photo_url || null;
    trainerWhatsapp = tt.data?.whatsapp_number || null;
    trainerInsta    = tt.data?.instagram_handle || null;
    trainerSpecs    = tt.data?.specialties || [];
  }

  const firstName  = profile?.full_name?.split(" ")[0] ?? "there";
  const ptDaysLeft = clientData?.pt_end_date
    ? Math.ceil((new Date(clientData.pt_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const waHref = trainerWhatsapp ? `https://wa.me/${trainerWhatsapp.replace(/[\s\-()]/g, "")}` : null;
  const igHref = trainerInsta    ? `https://instagram.com/${trainerInsta.replace("@", "")}`     : null;

  const planContent  = activePlan?.content as PlanContent | null;
  const todayWorkout = planContent ? getTodayWorkout(planContent) : null;
  const macros       = planContent ? getMacros(planContent) : null;

  return (
    <div className="animate-fade-up space-y-6 max-w-2xl px-0 sm:px-0">
      {/* ── Header ── */}
      <div>
        <h1 className="font-['Syne'] font-black text-[clamp(28px,5vw,40px)] leading-tight">
          Hey, <span className="text-[#FF5722]">{firstName}</span>
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-1.5">
          {clientData?.goals?.[0] ? `Working towards: ${clientData.goals[0]}` : "Welcome to your dashboard"}
        </p>
      </div>

      {/* ── Alerts ── */}
      {!clientData?.onboarding_done && (
        <div className="bg-[rgba(255,87,34,0.06)] border border-[rgba(255,87,34,0.2)] rounded-[14px] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-['Syne'] font-bold text-[14px] text-[#FF8A65] mb-1">Complete your assessment</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.45)]">Your coach needs your details to build a personalised plan.</p>
          </div>
          <Link href="/client/assessment/new" className="shrink-0 bg-[#FF5722] text-white font-['Syne'] font-bold text-[11px] uppercase tracking-[1.5px] px-4 py-2.5 rounded-[8px] hover:bg-[#FF8A65] transition-colors min-h-[44px] flex items-center">
            Start →
          </Link>
        </div>
      )}

      {ptDaysLeft !== null && ptDaysLeft <= 14 && ptDaysLeft >= 0 && (
        <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)] rounded-[14px] px-5 py-4">
          <p className="text-[13px] text-amber-400">
            Your PT package expires in <strong>{ptDaysLeft} day{ptDaysLeft !== 1 ? "s" : ""}</strong>. Contact your trainer to renew.
          </p>
        </div>
      )}

      {/* ── Today's Snapshot ── */}
      {activePlan ? (
        <div>
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.25)] mb-3">
            Today&apos;s Snapshot
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Today's workout */}
            <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(255,87,34,0.1)] flex items-center justify-center shrink-0">
                  <Dumbbell size={13} className="text-[#FF8A65]" />
                </div>
                <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)]">Workout</p>
              </div>
              {todayWorkout ? (
                <>
                  <p className="font-['Syne'] font-bold text-[15px] leading-snug">{todayWorkout.name}</p>
                  {todayWorkout.exercises > 0 && (
                    <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-1">{todayWorkout.exercises} exercises</p>
                  )}
                </>
              ) : (
                <p className="font-['Syne'] font-bold text-[14px] text-[rgba(255,255,255,0.5)]">Rest Day</p>
              )}
            </div>

            {/* Daily macros */}
            <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(255,87,34,0.1)] flex items-center justify-center shrink-0">
                  <Flame size={13} className="text-[#FF8A65]" />
                </div>
                <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)]">Daily Target</p>
              </div>
              {macros?.calories ? (
                <>
                  <p className="font-['Syne'] font-black text-[22px] text-[#FF5722] leading-none">{macros.calories}<span className="text-[12px] font-normal text-[rgba(255,255,255,0.35)] ml-1">kcal</span></p>
                  {(macros.protein || macros.carbs || macros.fats) && (
                    <div className="flex gap-2 mt-2 text-[11px] text-[rgba(255,255,255,0.4)]">
                      {macros.protein && <span>P {macros.protein}g</span>}
                      {macros.carbs   && <span>C {macros.carbs}g</span>}
                      {macros.fats    && <span>F {macros.fats}g</span>}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-[rgba(255,255,255,0.35)]">No targets set</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        clientData?.onboarding_done && (
          <div className="bg-[rgba(255,255,255,0.018)] border border-dashed border-[rgba(255,255,255,0.07)] rounded-[14px] p-6 text-center">
            <Dumbbell size={24} className="text-[rgba(255,87,34,0.3)] mx-auto mb-3" />
            <p className="font-['Syne'] font-bold text-[14px] text-[rgba(255,255,255,0.4)]">Your coach will create your plan soon</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.25)] mt-1">Check back after your trainer reviews your assessment</p>
          </div>
        )
      )}

      {/* ── Coach Card ── */}
      {trainerName && (
        <div className="bg-[rgba(255,87,34,0.05)] border border-[rgba(255,87,34,0.18)] rounded-[14px] p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="w-16 h-16 sm:w-14 sm:h-14 shrink-0">
              {trainerPhoto
                ? <img src={trainerPhoto} alt={trainerName} className="w-full h-full object-cover rounded-full" />
                : <AvatarFallback className="text-lg">{getInitials(trainerName)}</AvatarFallback>
              }
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mb-0.5">Your Coach</p>
              <p className="font-['Syne'] font-bold text-[18px] sm:text-[16px]">{trainerName}</p>
              {trainerSpecs.length > 0 && (
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mt-0.5">{trainerSpecs.slice(0, 2).join(" · ")}</p>
              )}
            </div>
          </div>

          <Link
            href="/client/chat"
            className="flex items-center justify-center gap-2.5 w-full bg-[#FF5722] hover:bg-[#FF8A65] text-white font-['Syne'] font-bold text-[15px] sm:text-[14px] px-5 py-4 sm:py-3.5 rounded-[10px] transition-colors min-h-[56px] sm:min-h-[48px] mb-3"
          >
            <MessageCircle size={18} className="sm:hidden" />
            <MessageCircle size={16} className="hidden sm:block" />
            Ask Coach {trainerName.split(" ")[0]}
          </Link>

          {(waHref || igHref) && (
            <div className="flex gap-2">
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-[8px] bg-green-500/8 border border-green-500/15 text-green-400 text-[13px] sm:text-[12px] font-['Syne'] font-bold hover:bg-green-500/12 transition-colors min-h-[48px] sm:min-h-[44px]">
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {igHref && (
                <a href={igHref} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-[8px] bg-pink-500/8 border border-pink-500/15 text-pink-400 text-[13px] sm:text-[12px] font-['Syne'] font-bold hover:bg-pink-500/12 transition-colors min-h-[48px] sm:min-h-[44px]">
                  <AtSign size={14} /> Instagram
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Nav ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/client/plan",           icon: Dumbbell,      title: "My Plan",    desc: "Workouts & nutrition" },
          { href: "/client/assessment/new", icon: ClipboardList, title: "Assessment", desc: "Update your stats"    },
          { href: "/client/profile",        icon: User,          title: "Profile",    desc: "My info"              },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card-glow bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4 group flex flex-col"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[rgba(255,87,34,0.08)] flex items-center justify-center mb-3 group-hover:bg-[rgba(255,87,34,0.14)] transition-colors shrink-0">
              <Icon size={16} className="text-[#FF8A65]" />
            </div>
            <p className="font-['Syne'] font-bold text-[13px] tracking-wide mb-0.5">{title}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mb-2">{desc}</p>
            <ChevronRight size={12} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors mt-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
