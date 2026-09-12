import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="no-print sticky top-0 z-10 flex items-center justify-end border-b border-[var(--border)]
                            bg-[var(--surface)]/80 px-6 py-3 backdrop-blur-md">
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
