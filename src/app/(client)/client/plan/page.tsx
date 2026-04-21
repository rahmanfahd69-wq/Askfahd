import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlanView } from "@/components/client/PlanView";
import type { Role } from "@/lib/supabase/types";
import { Download } from "lucide-react";

export default async function ClientPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if ((profileData as { role: Role } | null)?.role !== "client") redirect("/login");

  const [plansRes, clientRes] = await Promise.all([
    supabase
      .from("plans")
      .select("id, type, title, content, is_active, generated_by, created_at")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("onboarding_done").eq("id", user.id).single(),
  ]);

  const plans  = plansRes.data || [];
  const client = clientRes.data;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
            Your Plan
          </p>
          <h1 className="font-['Syne'] font-black text-[clamp(24px,4vw,36px)] leading-tight">
            My Fitness Plan
          </h1>
        </div>
        {plans.length > 0 && (
          <button
            disabled
            title="PDF export coming soon"
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.35)] text-[12px] font-['Syne'] font-bold cursor-not-allowed mt-1"
          >
            <Download size={13} />
            Download PDF
          </button>
        )}
      </div>

      {!client?.onboarding_done && (
        <div className="bg-[rgba(255,87,34,0.06)] border border-[rgba(255,87,34,0.2)] rounded-[14px] p-5">
          <p className="font-['Syne'] font-bold text-[14px] text-[#FF8A65] mb-1">Plan coming soon</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.45)]">
            Your trainer is setting up your profile. Your personalised plan will appear here once it&apos;s ready.
          </p>
        </div>
      )}

      <PlanView plans={plans as Parameters<typeof PlanView>[0]["plans"]} />
    </div>
  );
}
