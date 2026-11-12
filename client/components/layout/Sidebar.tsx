import type { SystemStatus } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { NavList } from "./NavList";
import { StatusWidget } from "./StatusWidget";

type SidebarProps = {
  systemStatus: SystemStatus | null;
};

export function Sidebar({ systemStatus }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 bg-bg-cream border-r border-lumen-teal/15 flex-col justify-between shadow-sm shrink-0">
      <div>
        <div className="p-5 border-b border-lumen-teal/15 flex items-center justify-center">
          <Logo width={208} height={41} />
        </div>

        <nav className="p-4 space-y-1.5">
          <NavList />
        </nav>
      </div>

      <StatusWidget systemStatus={systemStatus} />
    </aside>
  );
}
