"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Menu,
  X,
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

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-[8px] text-[14px] font-['Outfit'] font-medium transition-all min-h-[44px]",
              active
                ? "bg-[rgba(255,87,34,0.1)] text-[#FF8A65] border border-[rgba(255,87,34,0.2)]"
                : "text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.04)]"
            )}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.07)] h-screen sticky top-0 bg-[#050505]">
        <div className="px-6 py-7 border-b border-[rgba(255,255,255,0.07)]">
          <Logo href="/admin" />
          <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mt-1">
            Admin
          </span>
        </div>
        <NavLinks pathname={pathname} />
        <div className="px-3 py-5 border-t border-[rgba(255,255,255,0.07)]">
          <LogoutButton />
        </div>
      </aside>

      {/* ── Mobile: top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.07)]">
        <div style={{ height: "env(safe-area-inset-top)" }} />
        <div className="h-14 flex items-center justify-between px-4">
          <Logo href="/admin" size="sm" />
          <span className="text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)]">Admin</span>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── Mobile: drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[280px] h-full bg-[#050505] border-r border-[rgba(255,255,255,0.08)] flex flex-col">
            <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
              <div>
                <Logo href="/admin" size="sm" />
                <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.6)] mt-1">
                  Admin
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.06)]"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="px-3 pb-6 pt-2 border-t border-[rgba(255,255,255,0.07)]">
              <LogoutButton />
            </div>
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
