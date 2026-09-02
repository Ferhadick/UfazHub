"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getStoredUser, isWriteBlocked } from "@/lib/auth-storage";

export function SubmitLink() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    function sync() {
      setBlocked(isWriteBlocked(getStoredUser()));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("ufaz-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ufaz-auth-changed", sync);
    };
  }, []);

  if (blocked) {
    return (
      <span className="shrink-0 border border-line/40 px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-line/60" title="Your account cannot publish right now">
        + Submit
      </span>
    );
  }

  return (
    <Link
      href={"/submit" as Route}
      className="inline-flex items-center gap-1.5 border border-clay bg-clay px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-accent shadow-[2px_2px_0_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.35)] active:translate-y-0 active:shadow-none"
    >
      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      <span>Submit</span>
    </Link>
  );
}
