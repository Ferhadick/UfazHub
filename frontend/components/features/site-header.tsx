"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { AuthNav } from "@/components/features/auth-nav";
import type { Route } from "next";
import { SubmitLink } from "@/components/features/submit-link";

const links: { href: Route; label: string }[] = [
  { href: "/resources" as Route, label: "Resources" },
  { href: "/research" as Route, label: "Research" },
  { href: "/collections" as Route, label: "Collections" },
  { href: "/ask" as Route, label: "Questions" },
  { href: "/people" as Route, label: "People" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="h-1 bg-accent" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="shrink-0 py-3 leading-none" aria-label="UFAZ Hub home">
            <span className="block font-serif text-[22px] font-semibold tracking-tight text-ink">UFAZ Hub</span>
            <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-muted lg:block">Community knowledge</span>
          </Link>

          <nav className="hidden self-stretch md:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center border-b-2 px-3 text-sm font-medium transition-colors ${
                    active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-1.5 md:flex">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
            className="inline-flex h-9 items-center gap-2 rounded px-2.5 text-sm text-muted hover:bg-surface hover:text-ink"
            title="Search (Cmd/Ctrl + K)"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
          </button>
          <AuthNav />
          <SubmitLink />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
            className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-surface"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-surface"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="divide-y divide-line">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block py-3 text-base font-medium ${active ? "text-accent" : "text-ink"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <AuthNav />
              <SubmitLink />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
