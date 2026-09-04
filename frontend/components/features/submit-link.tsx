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
    return <span className="px-3 py-2 text-sm text-muted">Share</span>;
  }

  return (
    <Link
      href={"/submit" as Route}
      className="inline-flex h-9 items-center gap-1.5 rounded bg-accent px-3.5 text-sm font-semibold text-white hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      <span>Share</span>
    </Link>
  );
}
