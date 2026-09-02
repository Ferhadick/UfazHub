"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getStoredUser, isWriteBlocked } from "@/lib/auth-storage";

export function WriteBlockedNotice({ children }: { children: ReactNode }) {
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

  if (!blocked) return <>{children}</>;

  return (
    <div className="border border-line bg-paper px-4 py-6 font-sans text-sm leading-6">
      This account is muted. You can keep reading the archive, but publishing, editing, and voting are closed until the mute ends.
    </div>
  );
}
