import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CreateTrainerModal } from "@/components/admin/CreateTrainerModal";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export default async function TrainersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: trainersData }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("trainers")
      .select("id, is_active, ai_name, coaching_style, specialties, profiles(full_name, email, created_at)")
      .order("created_at", { ascending: false }),
  ]);

  if ((profileData as { role: string } | null)?.role !== "admin") redirect("/login");

  type TrainerRow = {
    id: string;
    is_active: boolean;
    ai_name: string;
    coaching_style: string | null;
    specialties: string[];
    profiles: { full_name: string; email: string; created_at: string } | null;
  };

  const trainers = (trainersData as TrainerRow[] | null) ?? [];

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
            Admin
          </p>
          <h1 className="font-['Syne'] font-black text-[32px]">Trainers</h1>
          <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-1">
            {trainers.length} trainer{trainers.length !== 1 ? "s" : ""} on the platform
          </p>
        </div>
        <CreateTrainerModal />
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.07)] rounded-[16px]">
          <p className="text-[rgba(255,255,255,0.3)] text-[14px]">No trainers yet. Add the first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_1fr_80px_40px] gap-4 px-5 pb-2">
            {["Trainer", "Email", "Specialties", "Status", ""].map((h) => (
              <span key={h} className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)]">
                {h}
              </span>
            ))}
          </div>

          {trainers.map((t) => (
            <Link
              key={t.id}
              href={`/admin/trainers/${t.id}`}
              className="grid grid-cols-[1fr_1fr_1fr_80px_40px] gap-4 items-center px-5 py-4 bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] hover:border-[rgba(255,87,34,0.25)] hover:bg-[rgba(255,255,255,0.04)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(255,87,34,0.12)] flex items-center justify-center text-[#FF8A65] font-['Syne'] font-bold text-[11px] shrink-0">
                  {getInitials(t.profiles?.full_name ?? "?")}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[rgba(255,255,255,0.9)]">{t.profiles?.full_name}</p>
                  <p className="text-[11px] text-[rgba(255,255,255,0.35)]">{t.ai_name}</p>
                </div>
              </div>
              <p className="text-[13px] text-[rgba(255,255,255,0.5)] truncate">{t.profiles?.email}</p>
              <div className="flex flex-wrap gap-1">
                {t.specialties.slice(0, 2).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px] py-0.5">{s}</Badge>
                ))}
                {t.specialties.length > 2 && (
                  <Badge variant="secondary" className="text-[10px] py-0.5">+{t.specialties.length - 2}</Badge>
                )}
              </div>
              <Badge variant={t.is_active ? "success" : "destructive"}>
                {t.is_active ? "Active" : "Off"}
              </Badge>
              <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] group-hover:text-[#FF5722] transition-colors justify-self-end" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
