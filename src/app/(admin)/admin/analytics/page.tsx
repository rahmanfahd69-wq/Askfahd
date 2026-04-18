import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, UserCheck, MessageSquare, ClipboardList, BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((meData as { role: string } | null)?.role !== "admin") redirect("/login");

  const [
    { count: trainerCount },
    { count: clientCount },
    { count: messageCount },
    { count: planCount },
    { count: assessmentCount },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("trainers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("chat_messages").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }),
    supabase.from("assessments").select("id", { count: "exact", head: true }),
    supabase
      .from("usage_events")
      .select("event_type, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const stats = [
    { label: "Active Trainers",  value: trainerCount   ?? 0, icon: UserCheck,    color: "#FF5722" },
    { label: "Active Clients",   value: clientCount    ?? 0, icon: Users,        color: "#FF8A65" },
    { label: "Total Messages",   value: messageCount   ?? 0, icon: MessageSquare, color: "#FF9100" },
    { label: "Plans Generated",  value: planCount      ?? 0, icon: BarChart3,    color: "#FF5722" },
    { label: "Assessments Taken", value: assessmentCount ?? 0, icon: ClipboardList, color: "#FF8A65" },
  ];

  type EventRow = { event_type: string; created_at: string; metadata: Record<string, unknown> | null };
  const events = (recentEvents as EventRow[] | null) ?? [];

  const eventLabels: Record<string, string> = {
    chat_message:      "Chat message sent",
    plan_generated:    "Plan generated",
    assessment_taken:  "Assessment taken",
    login:             "User logged in",
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">Admin</p>
        <h1 className="font-['Syne'] font-black text-[32px]">Analytics</h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-1">Platform-wide usage at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-5 text-center hover:border-[rgba(255,87,34,0.2)] transition-colors">
            <div className="flex justify-center mb-3">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="font-['Syne'] font-black text-[30px] leading-none mb-1" style={{ color }}>
              {value.toLocaleString()}
            </div>
            <div className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent events */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6">
        <p className="font-['Syne'] font-bold text-[11px] uppercase tracking-[2px] text-[rgba(255,255,255,0.4)] mb-5">
          Recent Activity
        </p>
        {events.length === 0 ? (
          <p className="text-[13px] text-[rgba(255,255,255,0.3)] py-6 text-center">No events recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] shrink-0" />
                  <span className="text-[13px] text-[rgba(255,255,255,0.7)]">
                    {eventLabels[ev.event_type] ?? ev.event_type}
                  </span>
                </div>
                <span className="text-[11px] text-[rgba(255,255,255,0.3)]">
                  {new Date(ev.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
