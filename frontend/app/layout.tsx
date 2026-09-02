import type { Metadata, Viewport } from "next";
import { CommandPalette } from "@/components/features/command-palette";
import { GuestBanner } from "@/components/features/guest-banner";
import { ModerationBanner } from "@/components/features/moderation-banner";
import { SiteHeader } from "@/components/features/site-header";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UFAZ Hub",
  description: "A student-built archive of useful UFAZ materials."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00357f"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="paper-grain min-h-screen overflow-x-clip bg-paper text-ink">
        <CommandPalette />
        <GuestBanner />
        <ModerationBanner />
        <SiteHeader />
        {children}
        <footer className="border-t border-line bg-accent px-4 py-7 pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-paper md:px-8">
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
