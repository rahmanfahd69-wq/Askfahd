"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, MessageCircle, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/client",            label: "Home",     icon: LayoutDashboard },
  { href: "/client/plan",       label: "Plan",     icon: Dumbbell },
  { href: "/client/chat",       label: "Chat",     icon: MessageCircle },
  { href: "/client/assessment", label: "Assess",   icon: ClipboardList },
  { href: "/client/profile",    label: "Me",       icon: User },
];

export function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#070707] border-t border-[rgba(255,255,255,0.08)] md:hidden">
      <div className="flex items-stretch" style={{ height: "72px", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative",
                active ? "text-[#FF5722]" : "text-[rgba(255,255,255,0.35)]"
              )}
            >
              {/* Active pill indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#FF5722] rounded-full" />
              )}
              <Icon
                size={active ? 21 : 19}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-all duration-150"
              />
              <span className={cn(
                "text-[10px] font-['Syne'] font-bold uppercase tracking-[0.5px] transition-all",
                active ? "text-[#FF5722]" : "text-[rgba(255,255,255,0.3)]"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
