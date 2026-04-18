"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Brain, User,
  Menu, X, LogOut, Mail, ChevronDown, ChevronUp,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trainer",             label: "Dashboard",   icon: LayoutDashboard },
  { href: "/trainer/clients",     label: "My Clients",  icon: Users },
  { href: "/trainer/ai-settings", label: "AI Settings", icon: Brain },
  { href: "/trainer/profile",     label: "Profile",     icon: User },
];

const ADMIN_EMAIL = "rahmanfahd69@gmail.com";

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/trainer" ? pathname === "/trainer" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );
}

function ContactAdmin() {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-3 pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full gap-2 px-4 py-3 rounded-[10px] text-[13px] font-['Outfit'] font-medium text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] transition-all min-h-[44px]"
      >
        <span className="flex items-center gap-3">
          <Mail size={16} className="shrink-0 text-[rgba(255,255,255,0.35)]" />
          Contact Admin
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-1 mx-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-4 py-3">
          <p className="text-[11px] text-[rgba(255,255,255,0.3)] mb-1.5">For support, suggestions, or account issues</p>
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="text-[12px] text-[#FF8A65] hover:text-[#FF5722] transition-colors break-all"
          >
            {ADMIN_EMAIL}
          </a>
        </div>
      )}
    </div>
  );
}

export function TrainerSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.07)] h-screen sticky top-0 bg-[#070707]">
        <div className="px-6 py-6 border-b border-[rgba(255,255,255,0.07)]">
          <Logo href="/trainer" />
          <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2.5px] text-[rgba(255,87,34,0.55)] mt-1.5">
            Coach Portal
          </span>
        </div>

        <NavLinks pathname={pathname} />

        <ContactAdmin />

        <div className="px-3 pb-5 pt-2 border-t border-[rgba(255,255,255,0.07)]">
          <LogoutButton />
        </div>
      </aside>

      {/* ── Mobile: top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#070707]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.07)]">
        <div style={{ height: "env(safe-area-inset-top)" }} />
        <div className="h-14 flex items-center justify-between px-4">
          <Logo href="/trainer" size="sm" />
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
        <div className="md:hidden fixed inset-0 z-50 flex animate-overlay-in">
          {/* Drawer */}
          <div className="w-[280px] h-full bg-[#080808] border-r border-[rgba(255,255,255,0.08)] flex flex-col animate-drawer-in">
            <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
              <div>
                <Logo href="/trainer" size="sm" />
                <span className="block text-[10px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.55)] mt-1">
                  Coach Portal
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

            <ContactAdmin />

            <div className="px-3 pb-6 pt-2 border-t border-[rgba(255,255,255,0.07)]">
              <LogoutButton />
            </div>
          </div>

          {/* Dim overlay */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
