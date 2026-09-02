"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AuthNav } from "@/components/features/auth-nav";
import type { Route } from "next";
import { SubmitLink } from "@/components/features/submit-link";

const links: { href: Route; label: string }[] = [
  { href: "/resources" as Route, label: "Explore" },
  { href: "/collections" as Route, label: "Collections" },
  { href: "/ask" as Route, label: "Q&A" },
  { href: "/people" as Route, label: "People" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-accent text-paper shadow-[0_1px_0_rgb(255_242_0_/_0.35)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-clay bg-clay/10 font-accent text-sm font-bold text-clay transition-all group-hover:bg-clay group-hover:text-accent">
              U
            </span>
            <div className="flex flex-col">
              <span className="font-accent text-base uppercase tracking-wider leading-none text-paper group-hover:text-clay transition-colors">
                UFAZ Hub
              </span>
              <span className="hidden sm:block text-[8px] uppercase tracking-[0.2em] text-line/70 leading-tight">
                Knowledge Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1 font-sans text-xs uppercase tracking-[0.16em] transition-colors ${
                    active ? "font-bold text-clay" : "text-paper/80 hover:text-paper hover:bg-white/5"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-clay" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Quick search button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
            className="flex items-center gap-2 border border-line/60 bg-accent/40 px-2.5 py-1 text-xs text-paper/70 transition-all hover:border-clay hover:text-paper"
            title="Search Archive (Cmd/Ctrl + K)"
          >
            <Search className="h-3.5 w-3.5 text-clay" />
            <span className="font-sans text-[11px] uppercase tracking-wider">Search</span>
            <kbd className="border border-line/50 bg-accent/80 px-1 py-0.2 font-mono text-[9px] text-paper/60">⌘K</kbd>
          </button>

          <div className="h-4 w-px bg-line/50" />

          <AuthNav />
          <SubmitLink />
        </div>

        {/* Mobile menu & search buttons */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
            className="flex h-8 w-8 items-center justify-center border border-line text-paper hover:border-clay hover:text-clay"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="border border-line px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-paper transition-colors hover:border-clay hover:bg-clay hover:text-accent"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-accent md:hidden animate-rise">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] font-sans text-base">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between border-b border-line/30 py-3 transition-colors ${
                    active ? "text-clay font-bold" : "text-paper hover:text-clay"
                  }`}
                >
                  <span className="text-sm uppercase tracking-wider">{link.label}</span>
                  <span className="text-xs text-line">↗</span>
                </Link>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/30 py-3">
              <AuthNav />
            </div>
            <div className="pt-3">
              <SubmitLink />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
