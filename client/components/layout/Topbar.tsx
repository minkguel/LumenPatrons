"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { discoverQuery } from "@/lib/discover";
import { useAuth } from "@/providers/AuthProvider";
import { NavList } from "./NavList";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SearchForm({ onSearched }: { onSearched: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onDiscover = pathname === "/";
  const urlQuery = onDiscover ? (searchParams.get("q") ?? "") : "";
  const category = onDiscover ? (searchParams.get("category") ?? "") : "";
  // The key resets the box when the URL changes (e.g. "Clear search").
  return <SearchBox key={urlQuery} initialText={urlQuery} category={category} onSearched={onSearched} />;
}

function SearchBox({
  initialText,
  category,
  onSearched,
}: {
  initialText: string;
  category: string;
  onSearched: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/${discoverQuery({ q: text, category })}`);
    onSearched();
  }

  return (
    <form
      role="search"
      aria-label="Search funding opportunities"
      onSubmit={handleSubmit}
      className="relative w-full max-w-96"
    >
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={100}
        aria-label="Search"
        placeholder="Search for biotech, seed funds, stipends..."
        className="w-full bg-bg-cream border border-lumen-teal/25 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-lumen-teal focus:ring-2 focus:ring-lumen-teal/40 transition-all text-foreground placeholder-foreground/35"
      />
      <span aria-hidden className="absolute left-3 top-2.5 text-foreground/40 text-sm">
        🔎
      </span>
    </form>
  );
}

export function Topbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Remember which page the mobile menu was opened on: it counts as open only
  // while we are still on that page, so any route change closes it.
  const [mobileOpenedAt, setMobileOpenedAt] = useState<string | null>(null);
  // Forget a stale "opened at" path as soon as the route changes, so going
  // back to that path later does not reopen the menu.
  if (mobileOpenedAt !== null && mobileOpenedAt !== pathname) setMobileOpenedAt(null);
  const mobileOpen = mobileOpenedAt === pathname;
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpenedAt(null);
        mobileButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

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
  }

  return (
    <header className="relative h-16 border-b border-lumen-teal/15 bg-surface flex items-center justify-between gap-3 px-4 md:px-8 shadow-sm shrink-0">
      <button
        ref={mobileButtonRef}
        type="button"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        onClick={() => setMobileOpenedAt(mobileOpen ? null : pathname)}
        className="md:hidden shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-lumen-teal-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumen-teal"
      >
        <span aria-hidden>{mobileOpen ? "✕" : "☰"}</span>
      </button>
      <Suspense fallback={<div className="w-full max-w-96" />}>
        <SearchForm onSearched={() => setMobileOpenedAt(null)} />
      </Suspense>

      {user ? (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-lumen-teal-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumen-teal"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="w-8 h-8 rounded-full bg-lumen-teal text-on-primary text-sm font-semibold flex items-center justify-center">
              {getInitials(user.fullName)}
            </span>
            <span className="text-sm font-medium text-foreground/80 hidden sm:block">
              {user.fullName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-surface border border-lumen-teal/15 rounded-lg shadow-md py-1 z-10">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-foreground/70 hover:bg-lumen-teal-light hover:text-lumen-teal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lumen-teal"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-foreground/70 hover:bg-lumen-teal-light hover:text-lumen-teal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lumen-teal"
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

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          onClick={(event) => {
            // Also close when the link points at the page we are already on.
            if ((event.target as HTMLElement).closest("a")) {
              setMobileOpenedAt(null);
              mobileButtonRef.current?.focus();
            }
          }}
          className="md:hidden absolute inset-x-0 top-full z-20 bg-bg-cream border-b border-lumen-teal/15 shadow-md p-4 space-y-1.5"
        >
          <NavList />
        </nav>
      )}
    </header>
  );
}
