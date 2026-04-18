import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssessmentForm } from "@/components/client/AssessmentForm";
import type { Role } from "@/lib/supabase/types";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profileData as { role: Role } | null)?.role !== "client") redirect("/login");

  const { data: clientData } = await supabase
    .from("clients")
    .select("age, gender, height_cm, weight_kg, goals, activity_level, gym_access, diet_type, sleep_hours, stress_level, work_hours, injuries, onboarding_done")
    .eq("id", user.id)
    .single();

  const isRetake = !!clientData?.onboarding_done;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          {isRetake ? "Update" : "Get Started"}
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(24px,4vw,36px)] leading-tight">
          {isRetake ? "Update Your Assessment" : "Build Your Profile"}
        </h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-2">
          {isRetake
            ? "Keep your stats current so your AI coach and trainer stay accurate."
            : "A few quick questions so your trainer can build the perfect plan for you."}
        </p>
      </div>

      <AssessmentForm defaultValues={clientData ?? undefined} isRetake={isRetake} />
    </div>
  );
}
