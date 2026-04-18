import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddClientModal } from "@/components/trainer/AddClientModal";
import { getInitials } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";
import { ChevronRight, UserPlus } from "lucide-react";

function getPTStatus(ptEndDate: string | null): { label: string; dotColor: string; textColor: string } {
  if (!ptEndDate) return { label: "No PT set", dotColor: "bg-[rgba(255,255,255,0.2)]", textColor: "text-[rgba(255,255,255,0.3)]" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(ptEndDate);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return { label: "Expired",                  dotColor: "bg-red-400",   textColor: "text-red-400"   };
  if (diffDays <= 14) return { label: `Expires in ${diffDays}d`,  dotColor: "bg-amber-400", textColor: "text-amber-400" };
  return          { label: `Active · ${diffDays}d left`,           dotColor: "bg-green-400", textColor: "text-green-400" };
}

export default async function TrainerClients() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profileData as { role: Role } | null)?.role !== "trainer") redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, is_active, pt_start_date, pt_end_date, goals, updated_at")
    .eq("trainer_id", user.id)
    .order("created_at", { ascending: false });

  const clientIds = (clients || []).map((c) => c.id);
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", clientIds)
    : { data: [] };

  const profileMap = Object.fromEntries((clientProfiles || []).map((p) => [p.id, p]));

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
            My Clients
          </p>
          <h1 className="font-['Syne'] font-black text-[clamp(24px,3vw,36px)] leading-tight">
            Client List
          </h1>
          <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-1">
            {(clients || []).length} client{(clients || []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="shrink-0 mt-1">
          <AddClientModal />
        </div>
      </div>

      {/* Empty state */}
      {(!clients || clients.length === 0) ? (
        <div className="text-center py-20 border border-dashed border-[rgba(255,255,255,0.08)] rounded-[16px]">
          <div className="w-14 h-14 rounded-full bg-[rgba(255,87,34,0.06)] flex items-center justify-center mx-auto mb-4">
            <UserPlus size={22} className="text-[rgba(255,87,34,0.4)]" />
          </div>
          <p className="font-['Syne'] font-bold text-[16px] text-[rgba(255,255,255,0.5)] mb-2">No clients yet</p>
          <p className="text-[13px] text-[rgba(255,255,255,0.25)] max-w-xs mx-auto mb-6">
            Add your first client to start creating personalised plans.
          </p>
          <AddClientModal />
        </div>
      ) : (
        <div className="space-y-2.5">
          {clients.map((client) => {
            const p  = profileMap[client.id];
            const displayName = p?.full_name?.trim() || p?.email?.split("@")[0] || "Client";
            const pt = getPTStatus(client.pt_end_date);
            const goals = (client.goals || []).slice(0, 3) as string[];
            return (
              <Link
                key={client.id}
                href={`/trainer/clients/${client.id}`}
                className="card-glow flex items-center gap-4 px-5 py-4 bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] group"
              >
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-['Syne'] font-bold text-[15px]">{displayName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      client.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {client.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-[12px] text-[rgba(255,255,255,0.35)] truncate mb-1.5">{p?.email}</p>
                  {goals.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {goals.map((g) => (
                        <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,87,34,0.08)] border border-[rgba(255,87,34,0.15)] text-[rgba(255,138,101,0.8)]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${pt.dotColor}`} />
                    <p className={`text-[12px] font-medium ${pt.textColor}`}>{pt.label}</p>
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.2)]">
                    {new Date(client.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>

                <ChevronRight size={16} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
