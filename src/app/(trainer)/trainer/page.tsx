import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight, CalendarClock, Brain, UserCircle2, MessageSquare } from "lucide-react";
import type { Role } from "@/lib/supabase/types";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { full_name: string; role: Role } | null;
  if (profile?.role !== "trainer") redirect("/login");

  const { data: trainerData } = await supabase
    .from("trainers")
    .select("ai_name")
    .eq("id", user.id)
    .single();

  const today    = new Date();
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);
  const todayStr  = today.toISOString().split("T")[0];
  const in14Str   = in14Days.toISOString().split("T")[0];
  const weekAgoStr = new Date(today.getTime() - 7 * 86400000).toISOString();

  // Fetch clients first, then count messages
  const { data: myClients } = await supabase
    .from("clients")
    .select("id")
    .eq("trainer_id", user.id);

  const clientIds = (myClients || []).map((c) => c.id);

  const [activeRes, expiringRes, messagesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("is_active", true),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).gte("pt_end_date", todayStr).lte("pt_end_date", in14Str),
    clientIds.length
      ? supabase.from("chat_messages").select("id", { count: "exact", head: true }).in("client_id", clientIds).gte("created_at", weekAgoStr)
      : Promise.resolve({ count: 0 }),
  ]);

  const activeCount   = activeRes.count ?? 0;
  const expiringCount = expiringRes.count ?? 0;
  const messagesCount = messagesRes.count ?? 0;
  const firstName     = profile?.full_name?.split(" ")[0] ?? "";
  const aiName        = trainerData?.ai_name;

  const quickLinks = [
    { href: "/trainer/clients",     label: "My Clients",  desc: "Manage profiles, plans & chat history", icon: Users       },
    { href: "/trainer/ai-settings", label: "AI Settings", desc: "Customise your AI coach personality",   icon: Brain       },
    { href: "/trainer/profile",     label: "My Profile",  desc: "Update bio, photo & contact info",      icon: UserCircle2 },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          Coach Dashboard
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(28px,4vw,40px)] leading-tight">
          Welcome, <span className="text-[#FF5722]">Coach {firstName}</span>
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-2">
          {aiName ? `Your AI coach "${aiName}" is active` : "Configure your AI coach in AI Settings"}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-glow bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center">
              <Users size={18} className="text-[#FF5722]" />
            </div>
          </div>
          <div className="font-['Syne'] font-black text-[40px] text-[#FF5722] leading-none mb-1">{activeCount}</div>
          <div className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">
            Active Clients
          </div>
        </div>

        <div className={`card-glow bg-[rgba(255,255,255,0.028)] border rounded-[14px] p-6 text-center ${
          expiringCount > 0 ? "border-[rgba(245,158,11,0.2)]" : "border-[rgba(255,255,255,0.07)]"
        }`}>
          <div className="flex justify-center mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              expiringCount > 0 ? "bg-[rgba(245,158,11,0.1)]" : "bg-[rgba(255,87,34,0.1)]"
            }`}>
              <CalendarClock size={18} className={expiringCount > 0 ? "text-amber-400" : "text-[#FF5722]"} />
            </div>
          </div>
          <div className={`font-['Syne'] font-black text-[40px] leading-none mb-1 ${expiringCount > 0 ? "text-amber-400" : "text-[#FF5722]"}`}>
            {expiringCount}
          </div>
          <div className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">
            Expiring ≤14d
          </div>
        </div>

        <div className="card-glow bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center">
              <MessageSquare size={18} className="text-[#FF5722]" />
            </div>
          </div>
          <div className="font-['Syne'] font-black text-[40px] text-[#FF5722] leading-none mb-1">{messagesCount}</div>
          <div className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">
            Messages 7d
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.25)] mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickLinks.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-glow flex flex-col gap-4 px-5 py-5 bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[rgba(255,87,34,0.08)] flex items-center justify-center group-hover:bg-[rgba(255,87,34,0.14)] transition-colors">
                <Icon size={18} className="text-[#FF8A65]" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-['Syne'] font-bold text-[14px] tracking-wide">{label}</p>
                  <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors" />
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.35)]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
