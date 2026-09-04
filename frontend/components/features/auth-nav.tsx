"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { LogOut, Shield } from "lucide-react";
import { getMe, logoutUser } from "@/lib/api";
import { clearAuthSession, getStoredUser, saveAuthSession, tokenKey } from "@/lib/auth-storage";

export function AuthNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileHref, setProfileHref] = useState("/profile/me");
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    function applyUser(user: ReturnType<typeof getStoredUser>) {
      setIsAdmin(user?.role === "admin");
      setProfileHref(user ? `/profile/${user.username}` : "/profile/me");
      setUserName(user?.name ?? null);
      setAvatarUrl(user?.avatar_url ?? null);
    }

    function syncAuthState() {
      const token = window.localStorage.getItem(tokenKey);
      const user = getStoredUser();
      setIsLoggedIn(Boolean(token));
      applyUser(user);

      if (token && !user) {
        getMe(token)
          .then((freshUser) => {
            saveAuthSession(token, freshUser);
            applyUser(freshUser);
          })
          .catch(() => undefined);
      }
    }

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("ufaz-auth-changed", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("ufaz-auth-changed", syncAuthState);
    };
  }, []);

  async function logout() {
    await logoutUser().catch(() => undefined);
    clearAuthSession();
    window.location.href = "/";
  }

  if (!isLoggedIn) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Link href="/login" className="rounded px-3 py-2 text-sm font-medium text-ink hover:bg-surface">
          Log in
        </Link>
        <Link href="/register" className="rounded border border-line px-3 py-2 text-sm font-medium text-ink hover:border-accent hover:text-accent">
          Sign up
        </Link>
      </div>
    );
  }

  const initials = userName
    ? userName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isAdmin ? (
        <Link
          href={"/admin" as Route}
          className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-xs font-medium text-accent hover:bg-surface"
        >
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Link>
      ) : null}

      <Link
        href={profileHref as Route}
        className="inline-flex h-9 items-center gap-2 rounded px-2 text-sm font-medium text-ink hover:bg-surface"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay text-[10px] font-semibold text-accent">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : initials}
        </span>
        <span className="hidden max-w-28 truncate xl:inline">{userName?.split(" ")[0] ?? "Profile"}</span>
      </Link>

      <button
        type="button"
        onClick={logout}
        title="Log out"
        aria-label="Log out"
        className="inline-flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
