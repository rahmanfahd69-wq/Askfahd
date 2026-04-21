import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";
import { getInitials } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";
import { Phone, AtSign, MessageCircle } from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";

export default async function ClientProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .eq("id", user.id)
    .single();

  if ((profileData as { role: Role } | null)?.role !== "client") redirect("/login");

  const { data: clientData } = await supabase
    .from("clients")
    .select("trainer_id, age, gender, height_cm, weight_kg, goals, activity_level, diet_type, pt_end_date")
    .eq("id", user.id)
    .single();

  let trainerName: string | null     = null;
  let trainerWhatsapp: string | null = null;
  let trainerInsta: string | null    = null;
  if (clientData?.trainer_id) {
    const [tp, tt] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", clientData.trainer_id).single(),
      supabase.from("trainers").select("whatsapp_number, instagram_handle").eq("id", clientData.trainer_id).single(),
    ]);
    trainerName     = tp.data?.full_name || null;
    trainerWhatsapp = tt.data?.whatsapp_number || null;
    trainerInsta    = tt.data?.instagram_handle || null;
  }

  const name       = profileData?.full_name || "Client";
  const waHref     = trainerWhatsapp ? `https://wa.me/${trainerWhatsapp.replace(/[\s\-()]/g, "")}` : null;
  const igHref     = trainerInsta    ? `https://instagram.com/${trainerInsta.replace("@", "")}`     : null;
  const ptDaysLeft = clientData?.pt_end_date
    ? Math.ceil((new Date(clientData.pt_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="animate-fade-up space-y-8 max-w-lg px-0 sm:px-0">
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          My Account
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(24px,4vw,36px)] leading-tight">Profile</h1>
      </div>

      {/* Profile header card */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 sm:p-6 mx-0">
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="w-16 h-16 text-lg shrink-0">
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-['Syne'] font-bold text-[18px]">{name}</p>
            <p className="text-[13px] text-[rgba(255,255,255,0.4)]">{profileData?.email}</p>
          </div>
        </div>

        {clientData?.pt_end_date && (
          <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <span className={`text-[12px] font-medium ${
              ptDaysLeft !== null && ptDaysLeft < 0
                ? "text-red-400"
                : ptDaysLeft !== null && ptDaysLeft <= 14
                  ? "text-amber-400"
                  : "text-green-400"
            }`}>
              PT until {new Date(clientData.pt_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* Coach card — prominent */}
      {trainerName && (
        <div className="bg-[rgba(255,87,34,0.05)] border border-[rgba(255,87,34,0.18)] rounded-[14px] p-5 sm:p-6">
          <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mb-3">
            Your Coach
          </p>
          <p className="font-['Syne'] font-black text-[22px] text-white mb-4">{trainerName}</p>

          <Link
            href="/client/chat"
            className="flex items-center justify-center gap-2.5 w-full bg-[#FF5722] hover:bg-[#FF8A65] text-white font-['Syne'] font-bold text-[14px] px-5 py-3.5 rounded-[10px] transition-colors min-h-[48px] mb-3"
          >
            <MessageCircle size={16} />
            Chat with {trainerName.split(" ")[0]}
          </Link>

          {(waHref || igHref) && (
            <div className="flex gap-2">
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-green-500/8 border border-green-500/15 text-green-400 text-[12px] font-['Syne'] font-bold hover:bg-green-500/12 transition-colors min-h-[44px]">
                  <Phone size={13} /> WhatsApp
                </a>
              )}
              {igHref && (
                <a href={igHref} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-pink-500/8 border border-pink-500/15 text-pink-400 text-[12px] font-['Syne'] font-bold hover:bg-pink-500/12 transition-colors min-h-[44px]">
                  <AtSign size={13} /> Instagram
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)] mb-5">
          Edit Profile
        </p>
        <ClientProfileForm
          data={{
            age:            clientData?.age ?? null,
            gender:         clientData?.gender ?? null,
            height_cm:      clientData?.height_cm ?? null,
            weight_kg:      clientData?.weight_kg ?? null,
            goals:          clientData?.goals || [],
            activity_level: clientData?.activity_level ?? null,
            diet_type:      clientData?.diet_type ?? null,
          }}
        />
      </div>

      {/* Sign out — visible on mobile (desktop has it in sidebar) */}
      <div className="md:hidden pt-2 border-t border-[rgba(255,255,255,0.07)]">
        <LogoutButton />
      </div>
    </div>
  );
}
