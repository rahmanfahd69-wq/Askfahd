import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/client/ChatInterface";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";

export default async function ClientChat() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if ((profileData as { role: Role } | null)?.role !== "client") redirect("/login");

  const { data: clientData } = await supabase
    .from("clients")
    .select("trainer_id")
    .eq("id", user.id)
    .single();

  const hasTrainer = !!clientData?.trainer_id;

  let trainerName: string | null  = null;
  let trainerPhoto: string | null = null;

  if (hasTrainer) {
    const [tp, tt] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", clientData!.trainer_id!).single(),
      supabase.from("trainers").select("photo_url").eq("id", clientData!.trainer_id!).single(),
    ]);
    trainerName  = tp.data?.full_name || null;
    trainerPhoto = tt.data?.photo_url || null;
  }

  const displayName = trainerName ? `Coach ${trainerName.split(" ")[0]}` : "Your AI Coach";

  return (
    <div className="animate-fade-up flex flex-col h-[calc(100dvh-72px-24px)] md:h-[calc(100dvh-80px)]">
      {/* Desktop header */}
      <div className="hidden md:flex items-center gap-4 mb-5 shrink-0 pb-5 border-b border-[rgba(255,255,255,0.07)]">
        <Avatar className="w-11 h-11 shrink-0">
          {trainerPhoto
            ? <img src={trainerPhoto} alt={displayName} className="w-full h-full object-cover rounded-full" />
            : <AvatarFallback>{getInitials(trainerName || "AI")}</AvatarFallback>
          }
        </Avatar>
        <div>
          <h1 className="font-['Syne'] font-black text-[22px] leading-tight">
            Chat with {displayName}
          </h1>
          <p className="text-[12px] text-[rgba(255,255,255,0.35)] mt-0.5">AI-powered · Personalised to your profile</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface
          clientName={profileData?.full_name?.split(" ")[0] || ""}
          trainerName={trainerName}
          hasTrainer={hasTrainer}
        />
      </div>
    </div>
  );
}
