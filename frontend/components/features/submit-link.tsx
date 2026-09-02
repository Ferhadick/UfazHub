"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
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
      <span className="shrink-0 border border-line/50 px-3 py-2 font-sans text-sm text-line sm:px-4" title="Your account cannot publish right now">
        + Submit
      </span>
    );
  }

  return (
    <Link href={"/resources/new" as Route} className="shrink-0 border border-line px-3 py-2 font-sans font-bold transition-colors hover:border-clay hover:bg-clay hover:text-accent sm:px-4">
      + Submit
    </Link>
  );
}
