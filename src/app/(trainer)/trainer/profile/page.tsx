import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrainerProfileForm } from "@/components/trainer/TrainerProfileForm";
import type { Role } from "@/lib/supabase/types";

export default async function TrainerProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, trainerRes] = await Promise.all([
    supabase.from("profiles").select("full_name, role, email").eq("id", user.id).single(),
    supabase.from("trainers").select("bio, photo_url, specialties, whatsapp_number, instagram_handle").eq("id", user.id).single(),
  ]);

  if ((profileRes.data as { role: Role } | null)?.role !== "trainer") redirect("/login");

  const profile = profileRes.data!;
  const trainer = trainerRes.data;

  return (
    <div className="animate-fade-up space-y-7 max-w-2xl">
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          Your Profile
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(24px,3vw,36px)] leading-tight">
          Coach Profile
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-2">
          Your bio and contact info are shown to your clients on their dashboard.
        </p>
      </div>

      <TrainerProfileForm
        fullName={profile.full_name}
        bio={trainer?.bio || null}
        photoUrl={trainer?.photo_url || null}
        specialties={trainer?.specialties || []}
        whatsapp={trainer?.whatsapp_number || null}
        instagram={trainer?.instagram_handle || null}
      />
    </div>
  );
}
