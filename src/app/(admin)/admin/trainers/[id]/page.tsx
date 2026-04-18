import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrainerBrandingForm } from "@/components/admin/TrainerBrandingForm";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";

export default async function TrainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((meData as { role: string } | null)?.role !== "admin") redirect("/login");

  const [{ data: trainerData }, { data: profileData }, { data: clientCount }] = await Promise.all([
    supabase.from("trainers").select("*").eq("id", id).single(),
    supabase.from("profiles").select("full_name, email, created_at, is_active").eq("id", id).single(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("trainer_id", id),
  ]);

  if (!trainerData || !profileData) notFound();

  type TrainerRow = {
    id: string; bio: string | null; coaching_style: string | null;
    ai_system_prompt: string | null; ai_name: string; photo_url: string | null;
    specialties: string[]; whatsapp_number: string | null; instagram_handle: string | null;
    is_active: boolean;
  };
  type ProfileRow = { full_name: string; email: string; created_at: string; is_active: boolean; };

  const trainer = trainerData as TrainerRow;
  const profile = profileData as ProfileRow;
  const clientsCount = (clientCount as { count?: number } | null)?.count ?? 0;

  return (
    <div className="animate-fade-up">
      <Link href="/admin/trainers" className="inline-flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)] transition-colors mb-8 font-['Syne'] font-bold uppercase tracking-[1.5px]">
        <ArrowLeft size={13} /> All Trainers
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,87,34,0.12)] flex items-center justify-center text-[#FF8A65] font-['Syne'] font-black text-[20px] shrink-0">
          {trainer.photo_url
            ? <img src={trainer.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
            : getInitials(profile.full_name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-['Syne'] font-black text-[28px]">{profile.full_name}</h1>
            <Badge variant={profile.is_active ? "success" : "destructive"}>
              {profile.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-1">{profile.email}</p>
          <div className="flex gap-4 mt-3 text-[12px] text-[rgba(255,255,255,0.35)]">
            <span>AI: <strong className="text-[#FF8A65]">{trainer.ai_name}</strong></span>
            <span>Clients: <strong className="text-[rgba(255,255,255,0.7)]">{clientsCount}</strong></span>
            <span>Joined: <strong className="text-[rgba(255,255,255,0.7)]">{formatDate(profile.created_at)}</strong></span>
          </div>
        </div>
      </div>

      {/* Branding form */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-8">
        <p className="font-['Syne'] font-bold text-[11px] uppercase tracking-[2px] text-[rgba(255,87,34,0.7)] mb-6">
          Branding & AI Settings
        </p>
        <TrainerBrandingForm
          trainer={{
            id,
            full_name: profile.full_name,
            bio: trainer.bio,
            coaching_style: trainer.coaching_style,
            ai_name: trainer.ai_name,
            ai_system_prompt: trainer.ai_system_prompt,
            photo_url: trainer.photo_url,
            whatsapp_number: trainer.whatsapp_number,
            instagram_handle: trainer.instagram_handle,
            specialties: trainer.specialties,
          }}
        />
      </div>
    </div>
  );
}
