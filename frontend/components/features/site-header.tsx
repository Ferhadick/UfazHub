"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthNav } from "@/components/features/auth-nav";
import { SubmitLink } from "@/components/features/submit-link";

const issue = new Date().toISOString().slice(0, 7).replace("-", "");

const links = [
  { href: "/resources", label: "Explore" },
  { href: "/collections", label: "Collections" },
  { href: "/people", label: "People" }
] as const;

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
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5 md:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 rotate-[-7deg] items-center justify-center border-4 border-clay font-accent text-lg text-clay transition-transform duration-200 group-hover:rotate-0">
            U
          </span>
          <span className="min-w-0">
            <span className="block font-accent text-base uppercase leading-none">UFAZ</span>
            <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.18em] sm:block">Knowledge Platform</span>
          </span>
        </Link>

        <div className="hidden shrink-0 items-center gap-3 border-x border-line/70 px-4 lg:flex">
          <span className="font-accent text-2xl leading-none text-clay">01</span>
          <span className="text-[9px] uppercase leading-3 tracking-[0.16em] text-line">
            Vol. 01
            <br />
            {issue.slice(0, 4)}
          </span>
        </div>

        <nav className="ml-auto hidden min-w-0 items-center justify-end gap-4 text-sm lg:flex lg:gap-5">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 font-sans transition-colors hover:text-clay">
              {link.label}
            </Link>
          ))}
          <AuthNav />
          <SubmitLink />
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
            className="border border-line px-3 py-2 font-sans text-xs uppercase tracking-[0.12em] transition-colors active:bg-clay active:text-accent hover:border-clay hover:bg-clay hover:text-accent"
          >
            Search
          </button>
          <button
            type="button"
            className="border border-line px-3 py-2 font-accent text-sm uppercase tracking-[0.08em] transition-colors active:bg-clay active:text-accent hover:border-clay hover:bg-clay hover:text-accent"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-accent lg:hidden animate-rise">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] font-sans text-lg">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between border-b border-line/40 py-3.5 transition-colors ${
                    active ? "text-clay font-bold" : "text-paper hover:text-clay"
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-line">↗</span>
                </Link>
              );
            })}
            <div className="flex flex-wrap items-center gap-4 border-b border-line/40 py-4">
              <AuthNav />
            </div>
            <div className="pt-2">
              <SubmitLink />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
