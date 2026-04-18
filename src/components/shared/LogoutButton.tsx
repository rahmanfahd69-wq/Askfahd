"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] text-[13px] font-['Outfit'] font-medium text-[rgba(255,255,255,0.4)] hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 group min-h-[44px]"
    >
      <LogOut size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-150" />
      Sign Out
    </button>
  );
}
