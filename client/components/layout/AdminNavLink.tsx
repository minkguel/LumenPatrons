"use client";

import { useAuth } from "@/providers/AuthProvider";
import { NavLink } from "./NavLink";

export function AdminNavLink() {
  const { user } = useAuth();
  if (!user?.isAdmin) return null;
  return (
    <NavLink href="/admin" icon="🛠️">
      Admin
    </NavLink>
  );
}
