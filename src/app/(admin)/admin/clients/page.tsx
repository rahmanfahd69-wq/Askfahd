import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((meData as { role: string } | null)?.role !== "admin") redirect("/login");

  const [{ data: clientsData }, { data: trainersData }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, trainer_id, is_active, profiles(full_name, email, created_at), trainers(profiles(full_name))")
      .order("created_at", { referencedTable: "profiles", ascending: false }),
    supabase
      .from("trainers")
      .select("id, profiles(full_name)")
      .eq("is_active", true),
  ]);

  type ClientRow = {
    id: string; trainer_id: string | null; is_active: boolean;
    profiles: { full_name: string; email: string; created_at: string } | null;
    trainers: { profiles: { full_name: string } | null } | null;
  };
  type TrainerOption = {
    id: string;
    profiles: { full_name: string } | null;
  };

  const clients  = (clientsData as ClientRow[]  | null) ?? [];
  const trainers = (trainersData as TrainerOption[] | null) ?? [];
  const trainerOptions = trainers.map((t) => ({ id: t.id, full_name: t.profiles?.full_name ?? "Unknown" }));

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">Admin</p>
        <h1 className="font-['Syne'] font-black text-[32px]">Clients</h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-1">
          {clients.length} client{clients.length !== 1 ? "s" : ""} on the platform
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.07)] rounded-[16px]">
          <p className="text-[rgba(255,255,255,0.3)] text-[14px]">No clients yet. Add the first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_100px_40px] gap-4 px-5 pb-2">
            {["Client", "Email", "Trainer", "Status", ""].map((h) => (
              <span key={h} className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)]">
                {h}
              </span>
            ))}
          </div>

          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="grid grid-cols-[1fr_1fr_1fr_100px_40px] gap-4 items-center px-5 py-4 bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] hover:border-[rgba(255,87,34,0.25)] hover:bg-[rgba(255,255,255,0.04)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[rgba(255,255,255,0.5)] font-['Syne'] font-bold text-[11px] shrink-0">
                  {getInitials(c.profiles?.full_name ?? "?")}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[rgba(255,255,255,0.9)]">{c.profiles?.full_name}</p>
                  <p className="text-[11px] text-[rgba(255,255,255,0.35)]">{formatDate(c.profiles?.created_at ?? "")}</p>
                </div>
              </div>
              <p className="text-[13px] text-[rgba(255,255,255,0.5)] truncate">{c.profiles?.email}</p>
              <p className="text-[13px] text-[rgba(255,255,255,0.5)] truncate">
                {c.trainers?.profiles?.full_name ?? <span className="text-[rgba(255,255,255,0.25)]">Unassigned</span>}
              </p>
              <div>
                <Badge variant={c.is_active ? "success" : "destructive"}>
                  {c.is_active ? "Active" : "Off"}
                </Badge>
              </div>
              <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors justify-self-end" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
