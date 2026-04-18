import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, UserCheck, MessageSquare, ClipboardList, ChevronRight, BarChart3, Settings } from "lucide-react";
import type { Role } from "@/lib/supabase/types";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { full_name: string; role: Role } | null;
  if (profile?.role !== "admin") redirect("/login");

  const [
    { count: trainerCount },
    { count: clientCount },
    { count: messageCount },
    { count: planCount },
  ] = await Promise.all([
    supabase.from("trainers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("clients").select("id",  { count: "exact", head: true }).eq("is_active", true),
    supabase.from("chat_messages").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id",    { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Active Trainers", value: trainerCount ?? 0, icon: UserCheck,     color: "text-[#FF5722]", bg: "bg-[rgba(255,87,34,0.1)]"  },
    { label: "Active Clients",  value: clientCount  ?? 0, icon: Users,         color: "text-blue-400",  bg: "bg-blue-500/10"             },
    { label: "Total Messages",  value: messageCount ?? 0, icon: MessageSquare, color: "text-purple-400",bg: "bg-purple-500/10"           },
    { label: "Plans Generated", value: planCount    ?? 0, icon: ClipboardList, color: "text-green-400", bg: "bg-green-500/10"            },
  ];

  const quickLinks = [
    { href: "/admin/trainers",  label: "Manage Trainers", desc: "Add or edit trainer accounts and AI personas", icon: UserCheck  },
    { href: "/admin/clients",   label: "Manage Clients",  desc: "Create clients, assign trainers, toggle access", icon: Users     },
    { href: "/admin/analytics", label: "Analytics",       desc: "Usage stats, message counts, plan activity",    icon: BarChart3  },
    { href: "/admin/settings",  label: "Settings",        desc: "Edit your admin profile and platform settings",  icon: Settings  },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          Admin Dashboard
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(28px,4vw,40px)] leading-tight">
          Platform Overview
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-2">
          Welcome, {profile?.full_name?.split(" ")[0] ?? "Admin"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 text-center"
          >
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mx-auto mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`font-['Syne'] font-black text-[36px] leading-none mb-1 ${color}`}>
              {value.toLocaleString()}
            </div>
            <div className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.25)] mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-glow flex items-center justify-between px-5 py-4 bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-[8px] bg-[rgba(255,87,34,0.08)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(255,87,34,0.14)] transition-colors">
                  <Icon size={16} className="text-[#FF8A65]" />
                </div>
                <div>
                  <p className="font-['Syne'] font-bold text-[14px] tracking-wide mb-0.5">{label}</p>
                  <p className="text-[12px] text-[rgba(255,255,255,0.35)]">{desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors shrink-0 ml-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
