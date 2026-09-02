"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { getMe, logoutUser } from "@/lib/api";
import { clearAuthSession, getStoredUser, saveAuthSession, tokenKey } from "@/lib/auth-storage";

export function AuthNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileHref, setProfileHref] = useState("/profile/me");

  useEffect(() => {
    function syncAuthState() {
      const token = window.localStorage.getItem(tokenKey);
      const user = getStoredUser();
      setIsLoggedIn(Boolean(token));
      setIsAdmin(user?.role === "admin");
      setProfileHref(user ? `/profile/${user.username}` : "/profile/me");

      if (token && !user) {
        getMe(token)
          .then((freshUser) => {
            saveAuthSession(token, freshUser);
            setProfileHref(`/profile/${freshUser.username}`);
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
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="border border-transparent px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.14em] text-paper/90 transition-colors hover:text-clay"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="border border-clay/80 bg-clay/10 px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-clay transition-all hover:bg-clay hover:text-accent"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const user = getStoredUser();
  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      {isAdmin ? (
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-1.5 border border-clay/50 bg-clay/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-clay transition-all hover:bg-clay hover:text-accent"
        >
          <ShieldAlert className="h-3 w-3 text-clay" />
          <span>Admin</span>
        </Link>
      ) : null}

      {/* User profile capsule */}
      <Link
        href={profileHref as Route}
        className="group inline-flex items-center gap-2 border border-line/60 bg-accent/40 px-2.5 py-1 transition-all hover:border-clay hover:bg-accent/80"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden border border-clay/60 bg-clay font-accent text-[9px] text-accent">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="font-sans text-xs font-bold tracking-wide text-paper transition-colors group-hover:text-clay">
          {user?.name?.split(" ")[0] ?? "Profile"}
        </span>
      </Link>

      {/* Log out button */}
      <button
        type="button"
        onClick={logout}
        title="Log out"
        className="inline-flex items-center gap-1 border border-line/40 px-2 py-1.5 font-sans text-xs uppercase tracking-wider text-paper/70 transition-all hover:border-red-400 hover:text-red-300 active:scale-95"
      >
        <LogOut className="h-3 w-3 stroke-[2]" />
        <span className="hidden xl:inline text-[10px]">Exit</span>
      </button>
    </div>
  );
}
