"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { continueAsGuest } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";

export function GuestBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    function syncState() {
      const isLoggedIn = Boolean(window.localStorage.getItem(tokenKey));
      const alreadySeen = window.localStorage.getItem("ufaz_entry_seen") === "true";
      setHidden(isLoggedIn || alreadySeen);
    }
    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener("ufaz-auth-changed", syncState);
    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("ufaz-auth-changed", syncState);
    };
  }, []);

  async function continueGuest() {
    await continueAsGuest().catch(() => undefined);
    window.localStorage.setItem("ufaz_entry_seen", "true");
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="border-b border-line bg-paper px-4 py-3 text-sm md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span className="text-muted">Create an account to vote and publish resources.</span>
        <div className="flex flex-wrap gap-2">
          <Link href="/register" className="border border-line px-3 py-2">Sign up</Link>
          <Link href="/login" className="border border-line px-3 py-2">Log in</Link>
          <Button type="button" variant="quiet" onClick={continueGuest}>Continue as guest</Button>
        </div>
      </div>
    </div>
  );
}
