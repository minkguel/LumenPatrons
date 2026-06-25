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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive
          ? "bg-lumen-teal text-white shadow-sm"
          : "text-foreground/60 hover:text-lumen-teal hover:bg-lumen-teal-light"
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
