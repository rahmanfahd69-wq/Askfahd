"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/trainers",  label: "Trainers",   icon: UserCheck },
  { href: "/admin/clients",   label: "Clients",    icon: Users },
  { href: "/admin/analytics", label: "Analytics",  icon: BarChart3 },
  { href: "/admin/settings",  label: "Settings",   icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.07)] h-screen sticky top-0 bg-[#050505]">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-[rgba(255,255,255,0.07)]">
        <Logo href="/admin" />
        <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mt-1">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-['Outfit'] font-medium transition-all",
                active
                  ? "bg-[rgba(255,87,34,0.1)] text-[#FF8A65] border border-[rgba(255,87,34,0.2)]"
                  : "text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.04)]"
              )}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-5 border-t border-[rgba(255,255,255,0.07)]">
        <LogoutButton />
      </div>
    </aside>
  );
}
