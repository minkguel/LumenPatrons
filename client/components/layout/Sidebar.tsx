import Image from "next/image";
import type { SystemStatus } from "@/lib/api";
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
          <Image
            src="/LumenPatronsLogo.png"
            alt="LumenPatrons"
            width={160}
            height={60}
            className="object-contain"
            priority
          />
        </div>

        <nav className="p-4 space-y-1.5">
          <NavLink href="/" icon="🔍">
            Discover Patrons
          </NavLink>
          <NavLink href="/applications" icon="📁">
            My Applications
          </NavLink>
          <NavLink href="/settings" icon="⚙️">
            Settings
          </NavLink>
        </nav>
      </div>

      <StatusWidget systemStatus={systemStatus} />
    </aside>
  );
}
