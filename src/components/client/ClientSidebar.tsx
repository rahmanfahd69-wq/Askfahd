"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, MessageCircle, UtensilsCrossed, User } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/client",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/client/plan",      label: "My Plan",    icon: Dumbbell },
  { href: "/client/chat",      label: "Chat",       icon: MessageCircle },
  { href: "/client/tracker",   label: "Tracker",    icon: UtensilsCrossed },
  { href: "/client/profile",   label: "Profile",    icon: User },
];

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.07)] h-screen sticky top-0 bg-[#070707]">
      <div className="px-6 py-6 border-b border-[rgba(255,255,255,0.07)]">
        <Logo href="/client" />
        <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2.5px] text-[rgba(255,87,34,0.55)] mt-1.5">
          My Dashboard
        </span>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-[10px] text-[14px] font-['Outfit'] font-medium transition-all duration-150 group min-h-[44px]",
                active
                  ? "bg-[rgba(255,87,34,0.1)] text-[#FF8A65] border border-[rgba(255,87,34,0.2)] shadow-[0_0_12px_rgba(255,87,34,0.06)]"
                  : "text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)]"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-transform duration-150 group-hover:scale-110",
                  active ? "text-[#FF5722]" : "text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.8)]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 pt-2 border-t border-[rgba(255,255,255,0.07)]">
        <LogoutButton />
      </div>
    </aside>
  );
}
