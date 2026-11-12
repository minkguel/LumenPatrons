import type { SystemStatus } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { AdminNavLink } from "./AdminNavLink";
import { NavLink } from "./NavLink";
import { StatusWidget } from "./StatusWidget";

type SidebarProps = {
  systemStatus: SystemStatus | null;
};

export function Sidebar({ systemStatus }: SidebarProps) {
  return (
    <aside className="w-64 bg-bg-cream border-r border-lumen-teal/15 flex flex-col justify-between shadow-sm shrink-0">
      <div>
        <div className="p-5 border-b border-lumen-teal/15 flex items-center justify-center">
          <Logo width={208} height={41} />
        </div>

        <nav className="p-4 space-y-1.5">
          <NavLink href="/" icon="🔍">
            Discover Patrons
          </NavLink>
          <NavLink href="/saved-patrons" icon="📁">
            Saved Patrons
          </NavLink>
          <NavLink href="/settings" icon="⚙️">
            Settings
          </NavLink>
          <AdminNavLink />
        </nav>
      </div>

      <StatusWidget systemStatus={systemStatus} />
    </aside>
  );
}
