import Link from "next/link";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/features/command-palette";
import { GuestBanner } from "@/components/features/guest-banner";
import { ModerationBanner } from "@/components/features/moderation-banner";
import { SiteHeader } from "@/components/features/site-header";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UFAZ Hub",
  description: "Community knowledge, research, resources and questions from UFAZ."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-clip bg-paper text-ink">
        <CommandPalette />
        <GuestBanner />
        <ModerationBanner />
        <SiteHeader />
        {children}
        <footer className="mt-12 border-t border-line bg-surface px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-base font-semibold text-ink">UFAZ Hub</p>
              <p className="mt-1 text-xs">Shared by the UFAZ community.</p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
              <Link href="/resources" className="hover:text-ink">Resources</Link>
              <Link href="/research" className="hover:text-ink">Research</Link>
              <Link href="/people" className="hover:text-ink">People</Link>
              <Link href="/ask" className="hover:text-ink">Questions</Link>
              <Link href="/submit" className="hover:text-ink">Share</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
