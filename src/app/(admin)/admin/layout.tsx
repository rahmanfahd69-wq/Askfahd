import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505] overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Mobile spacer = fixed header height + safe-area-inset-top */}
        <div
          className="md:hidden"
          style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}
          aria-hidden="true"
        />
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
