"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
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
      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
        <Link href="/login" className="font-sans transition-colors hover:text-clay">
          Log in
        </Link>
        <Link href="/register" className="border border-line px-3 py-2 font-sans font-bold transition-colors hover:border-clay hover:bg-clay hover:text-accent">
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
    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
      {isAdmin ? (
        <Link href={"/admin" as Route} className="font-sans text-xs uppercase tracking-wider text-clay hover:underline">
          Admin Panel
        </Link>
      ) : null}
      <Link href={profileHref as Route} className="flex items-center gap-2 font-sans transition-colors hover:text-clay">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden border border-line bg-clay font-accent text-[10px] text-accent">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span>{user?.name?.split(" ")[0] ?? "Profile"}</span>
      </Link>
      <button type="button" onClick={logout} className="font-sans text-xs uppercase tracking-wider text-muted transition-colors hover:text-clay">
        Log out
      </button>
    </div>
  );
}
