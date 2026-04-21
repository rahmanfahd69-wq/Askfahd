import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { ClientBottomNav } from "@/components/client/ClientBottomNav";
import { Phone, AtSign } from "lucide-react";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clientData } = await supabase
    .from("clients")
    .select("is_active, trainer_id")
    .eq("id", user.id)
    .single();

  // Track last active
  await supabase
    .from("clients")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  if (clientData && clientData.is_active === false) {
    let trainerName: string | null = null;
    let trainerWhatsapp: string | null = null;
    let trainerEmail: string | null = null;

    if (clientData.trainer_id) {
      const [tp, tt] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", clientData.trainer_id).single(),
        supabase.from("trainers").select("whatsapp_number").eq("id", clientData.trainer_id).single(),
      ]);
      trainerName = tp.data?.full_name || null;
      trainerEmail = tp.data?.email || null;
      trainerWhatsapp = tt.data?.whatsapp_number || null;
    }

    const waHref = trainerWhatsapp ? `https://wa.me/${trainerWhatsapp.replace(/[\s\-()]/g, "")}` : null;

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="font-['Syne'] font-black text-[26px] mb-3">Membership Expired</h1>
          <p className="text-[14px] text-[rgba(255,255,255,0.5)] leading-relaxed mb-8">
            Your membership has expired. Contact your coach to renew and regain access.
          </p>

          {(trainerName || waHref || trainerEmail) && (
            <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-5 text-left mb-6">
              <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mb-3">Your Coach</p>
              {trainerName && (
                <p className="font-['Syne'] font-bold text-[16px] mb-3">{trainerName}</p>
              )}
              <div className="space-y-2">
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] bg-green-500/8 border border-green-500/20 text-green-400 text-[13px] font-['Syne'] font-bold hover:bg-green-500/12 transition-colors"
                  >
                    <Phone size={15} /> WhatsApp Coach
                  </a>
                )}
                {trainerEmail && (
                  <a
                    href={`mailto:${trainerEmail}`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] text-[13px] font-['Syne'] font-bold hover:bg-[rgba(255,255,255,0.07)] transition-colors"
                  >
                    <AtSign size={15} /> {trainerEmail}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] overflow-x-hidden">
      <ClientSidebar />
      <main className="flex-1 overflow-y-auto md:pb-0" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
        <div className="md:hidden" style={{ height: "env(safe-area-inset-top)" }} aria-hidden="true" />
        <div className="px-4 md:px-10 py-6 md:py-10">
          {children}
        </div>
      </main>
      <ClientBottomNav />
    </div>
  );
}
