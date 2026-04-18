import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientDetailForm } from "@/components/admin/ClientDetailForm";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((meData as { role: string } | null)?.role !== "admin") redirect("/login");

  const [{ data: clientData }, { data: profileData }, { data: trainersData }, { data: planCount }, { data: msgCount }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("profiles").select("full_name, email, created_at, is_active").eq("id", id).single(),
      supabase.from("trainers").select("id, profiles(full_name)").eq("is_active", true),
      supabase.from("plans").select("id", { count: "exact", head: true }).eq("client_id", id),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("client_id", id),
    ]);

  if (!clientData || !profileData) notFound();

  type ClientRow = {
    id: string; trainer_id: string | null; age: number | null; gender: string | null;
    height_cm: number | null; weight_kg: number | null; goals: string[];
    activity_level: string | null; gym_access: string | null; diet_type: string | null;
    sleep_hours: string | null; stress_level: string | null; work_hours: string | null;
    injuries: string[]; onboarding_done: boolean; is_active: boolean;
  };
  type TrainerOption = { id: string; profiles: { full_name: string } | null };

  const client  = clientData as ClientRow;
  const profile = profileData as { full_name: string; email: string; created_at: string; is_active: boolean };
  const trainers = ((trainersData as TrainerOption[] | null) ?? []).map(
    (t) => ({ id: t.id, full_name: t.profiles?.full_name ?? "Unknown" })
  );

  const stats = [
    { label: "Plans",    value: (planCount as { count?: number } | null)?.count ?? 0 },
    { label: "Messages", value: (msgCount  as { count?: number } | null)?.count ?? 0 },
  ];

  const bio: { label: string; value: string | number | null }[] = [
    { label: "Age",      value: client.age },
    { label: "Gender",   value: client.gender },
    { label: "Height",   value: client.height_cm ? `${client.height_cm} cm` : null },
    { label: "Weight",   value: client.weight_kg ? `${client.weight_kg} kg` : null },
    { label: "Activity", value: client.activity_level },
    { label: "Gym",      value: client.gym_access },
    { label: "Diet",     value: client.diet_type },
    { label: "Sleep",    value: client.sleep_hours },
    { label: "Stress",   value: client.stress_level },
    { label: "Work hrs", value: client.work_hours },
  ];

  return (
    <div className="animate-fade-up">
      <Link href="/admin/clients" className="inline-flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)] transition-colors mb-8 font-['Syne'] font-bold uppercase tracking-[1.5px]">
        <ArrowLeft size={13} /> All Clients
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-14 h-14 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[rgba(255,255,255,0.5)] font-['Syne'] font-black text-[18px] shrink-0">
          {getInitials(profile.full_name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-['Syne'] font-black text-[28px]">{profile.full_name}</h1>
            <Badge variant={profile.is_active ? "success" : "destructive"}>
              {profile.is_active ? "Active" : "Inactive"}
            </Badge>
            {client.onboarding_done && <Badge variant="default">Assessed</Badge>}
          </div>
          <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-1">{profile.email}</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.3)] mt-1">Joined {formatDate(profile.created_at)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-4 text-center">
            <div className="font-['Syne'] font-black text-[28px] text-[#FF5722]">{value}</div>
            <div className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.35)]">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biometrics */}
        {client.onboarding_done ? (
          <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6">
            <p className="font-['Syne'] text-[11px] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.4)] mb-5">
              Biometrics & Lifestyle
            </p>
            <div className="grid grid-cols-2 gap-3">
              {bio.filter(b => b.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-0.5">{label}</p>
                  <p className="text-[13px] text-[rgba(255,255,255,0.8)]">{value}</p>
                </div>
              ))}
            </div>
            {client.goals.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-2">Goals</p>
                <div className="flex flex-wrap gap-1">
                  {client.goals.map((g) => <Badge key={g} variant="secondary">{g}</Badge>)}
                </div>
              </div>
            )}
            {client.injuries.filter((i) => i !== "None").length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-2">Injuries</p>
                <div className="flex flex-wrap gap-1">
                  {client.injuries.filter((i) => i !== "None").map((inj) => (
                    <Badge key={inj} variant="destructive">{inj}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[rgba(255,255,255,0.028)] border border-dashed border-[rgba(255,255,255,0.07)] rounded-[12px] p-6 flex items-center justify-center">
            <p className="text-[13px] text-[rgba(255,255,255,0.3)]">Assessment not completed yet.</p>
          </div>
        )}

        {/* Management */}
        <ClientDetailForm
          clientId={id}
          currentTrainerId={client.trainer_id}
          isActive={profile.is_active}
          trainers={trainers}
        />
      </div>
    </div>
  );
}
