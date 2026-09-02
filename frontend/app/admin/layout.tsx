"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getStoredUser } from "@/lib/auth-storage";

const links = [
  { href: "/admin" as Route, label: "Overview" },
  { href: "/admin/users" as Route, label: "People" },
  { href: "/admin/content" as Route, label: "Holdings" },
  { href: "/admin/activity" as Route, label: "Ledger" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role !== "admin") {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <p className="font-sans text-sm text-muted">Checking desk access...</p>
      </main>
    );
  }

  return (
    <div>
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted">UFAZ / Desk</div>
            <h1 className="mt-1 font-accent text-4xl">Moderation ledger</h1>
          </div>
          <nav className="flex flex-wrap gap-3 font-sans text-sm">
            {links.map((link) => {
              const active = pathname === link.href || (link.href !== ("/admin" as Route) && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={active ? "border-b-2 border-clay pb-1 font-bold" : "pb-1 text-muted hover:text-ink"}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
