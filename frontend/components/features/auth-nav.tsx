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

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
      {isAdmin ? (
        <Link href={"/admin" as Route} className="font-sans transition-colors hover:text-clay">
          Admin
        </Link>
      ) : null}
      <Link href={profileHref as Route} className="font-sans transition-colors hover:text-clay">
        Profile
      </Link>
      <button type="button" onClick={logout} className="font-sans text-sm transition-colors hover:text-clay">
        Log out
      </button>
    </div>
  );
}
