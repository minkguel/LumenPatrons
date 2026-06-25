"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="h-16 border-b border-lumen-teal/15 bg-white flex items-center justify-between px-8 shadow-sm shrink-0">
      <div className="relative w-96">
        <input
          type="text"
          placeholder="Search for biotech, seed funds, stipends..."
          className="w-full bg-bg-cream border border-lumen-teal/25 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-lumen-teal focus:ring-1 focus:ring-lumen-teal/40 transition-all text-foreground placeholder-foreground/35"
        />
        <span className="absolute left-3 top-2.5 text-foreground/40 text-sm">
          🔎
        </span>
      </div>

      {user ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-lumen-teal-light transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-lumen-teal text-white text-sm font-semibold flex items-center justify-center">
              {getInitials(user.fullName)}
            </span>
            <span className="text-sm font-medium text-foreground/80 hidden sm:block">
              {user.fullName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-lumen-teal/15 rounded-lg shadow-md py-1 z-10">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-foreground/70 hover:bg-lumen-teal-light hover:text-lumen-teal transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-foreground/70 hover:bg-lumen-teal-light hover:text-lumen-teal transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <Link href="/auth?tab=signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth?tab=signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
