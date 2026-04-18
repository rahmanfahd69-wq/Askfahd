import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name: string; email: string; role: string; created_at: string;
  } | null;

  if (profile?.role !== "admin") redirect("/login");

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">Admin</p>
        <h1 className="font-['Syne'] font-black text-[32px]">Settings</h1>
        <p className="text-[14px] text-[rgba(255,255,255,0.4)] mt-1">Your admin account details.</p>
      </div>

      <div className="max-w-[560px]">
        {/* Account info strip */}
        <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(255,87,34,0.12)] flex items-center justify-center font-['Syne'] font-black text-[#FF8A65] text-[16px] shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Syne'] font-bold text-[15px]">{profile?.full_name}</span>
              <Badge variant="default">Admin</Badge>
            </div>
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] mt-0.5">
              {profile?.email} · Joined {formatDate(profile?.created_at ?? "")}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-8">
          <p className="font-['Syne'] font-bold text-[11px] uppercase tracking-[2px] text-[rgba(255,87,34,0.7)] mb-6">
            Edit Profile
          </p>
          <AdminProfileForm currentName={profile?.full_name ?? ""} />
        </div>
      </div>
    </div>
  );
}
