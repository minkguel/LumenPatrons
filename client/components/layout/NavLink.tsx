"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  icon: string;
  children: React.ReactNode;
};

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumen-teal ${
        isActive
          ? "bg-lumen-teal text-on-primary shadow-sm"
          : "text-foreground/60 hover:text-lumen-teal hover:bg-lumen-teal-light"
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
