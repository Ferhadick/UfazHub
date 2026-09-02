import type { Metadata } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/features/auth-nav";
import { CommandPalette } from "@/components/features/command-palette";
import { GuestBanner } from "@/components/features/guest-banner";
import { ModerationBanner } from "@/components/features/moderation-banner";
import { SubmitLink } from "@/components/features/submit-link";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UFAZ Hub",
  description: "A student-built archive of useful UFAZ materials."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const issue = new Date().toISOString().slice(0, 7).replace("-", "");

  return (
    <html lang="en">
      <body className="paper-grain min-h-screen bg-paper text-ink">
        <CommandPalette />
        <GuestBanner />
        <ModerationBanner />
        <header className="sticky top-0 z-30 border-b border-line bg-accent text-paper shadow-[0_1px_0_rgb(255_242_0_/_0.35)]">
          <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 md:px-8">
            <Link href="/" className="group flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 rotate-[-7deg] items-center justify-center border-4 border-clay font-accent text-lg text-clay transition-transform duration-200 group-hover:rotate-0">U</span>
              <span>
                <span className="block font-accent text-base uppercase">UFAZ</span>
                <span className="hidden text-[10px] uppercase tracking-[0.18em] sm:block">Knowledge Platform</span>
              </span>
            </Link>

            <div className="hidden shrink-0 items-center gap-3 border-x border-line/70 px-4 lg:flex">
              <span className="font-accent text-2xl leading-none text-clay">01</span>
              <span className="text-[9px] uppercase leading-3 tracking-[0.16em] text-line">Vol. 01<br />{issue.slice(0, 4)}</span>
            </div>

            <nav className="ml-auto flex min-w-0 items-center justify-end gap-3 text-sm sm:gap-4 lg:gap-5">
              <Link href="/resources" className="shrink-0 font-sans transition-colors hover:text-clay">Explore</Link>
              <Link href="/collections" className="shrink-0 font-sans transition-colors hover:text-clay">Collections</Link>
              <Link href="/people" className="shrink-0 font-sans transition-colors hover:text-clay">People</Link>
              <AuthNav />
              <SubmitLink />
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-line bg-accent px-4 py-7 text-paper md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 text-[11px] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-clay">UFAZ / KNOWLEDGE</p>
            </div>
            <div className="max-w-xl text-line">
              UFAZ / KNOWLEDGE - Made by students, for students. Anonymous usage is tracked to improve the platform and is merged into your account on sign-up.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
