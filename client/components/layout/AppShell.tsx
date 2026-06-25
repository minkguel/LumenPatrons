import type { SystemStatus } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  systemStatus: SystemStatus | null;
  children: React.ReactNode;
};

export function AppShell({ systemStatus, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-bg-cream text-foreground font-sans selection:bg-patron-gold/20">
      <Sidebar systemStatus={systemStatus} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
