import { ClientSidebar } from "@/components/client/ClientSidebar";
import { ClientBottomNav } from "@/components/client/ClientBottomNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505] overflow-x-hidden">
      <ClientSidebar />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Safe-area spacer for iOS notch — zero on Android/desktop */}
        <div className="md:hidden" style={{ height: "env(safe-area-inset-top)" }} aria-hidden="true" />
        <div className="px-4 md:px-10 py-6 md:py-10">
          {children}
        </div>
      </main>
      <ClientBottomNav />
    </div>
  );
}
