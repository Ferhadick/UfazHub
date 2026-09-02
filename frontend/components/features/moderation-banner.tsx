"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import { getStoredToken, getStoredUser, saveAuthSession } from "@/lib/auth-storage";

export function ModerationBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      const user = getStoredUser();
      if (!user) {
        setMessage(null);
        return;
      }
      if (user.status === "muted") {
        const until = user.muted_until ? new Date(user.muted_until).toLocaleString() : "further notice";
        setMessage(`Your account is muted until ${until}. You can read the archive, but you cannot publish, edit, or vote.`);
        return;
      }
      if (user.warning_count > 0 && user.status === "active") {
        setMessage(`You have ${user.warning_count} warning${user.warning_count === 1 ? "" : "s"} on this account. Further warnings may result in a mute.`);
        return;
      }
      setMessage(null);
    }

    sync();
    const token = getStoredToken();
    if (token) {
      getMe(token)
        .then((user) => {
          saveAuthSession(token, user);
          sync();
        })
        .catch(() => undefined);
    }
    window.addEventListener("ufaz-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufaz-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="border-b border-line bg-clay/40 px-4 py-3 text-sm md:px-8">
      <div className="mx-auto max-w-7xl font-sans text-ink">{message}</div>
    </div>
  );
}
