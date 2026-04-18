import { TrainerSidebar } from "@/components/trainer/TrainerSidebar";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505] overflow-x-hidden">
      <TrainerSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Mobile spacer = fixed header height + safe-area-inset-top */}
        <div
          className="md:hidden"
          style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}
          aria-hidden="true"
        />
        <div className="px-5 md:px-10 py-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
