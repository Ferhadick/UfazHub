import type { UserPublic } from "@/types/api";

export const tokenKey = "ufaz_access_token";
export const userKey = "ufaz_user";

export function saveAuthSession(accessToken: string, user: UserPublic) {
  window.localStorage.setItem(tokenKey, accessToken);
  window.localStorage.setItem(userKey, JSON.stringify(user));
  window.dispatchEvent(new Event("ufaz-auth-changed"));
}

export function clearAuthSession() {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(userKey);
  window.dispatchEvent(new Event("ufaz-auth-changed"));
}

export function getStoredUser(): UserPublic | null {
  const raw = window.localStorage.getItem(userKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserPublic;
  } catch {
    window.localStorage.removeItem(userKey);
    return null;
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(tokenKey);
}

export function isWriteBlocked(user: UserPublic | null): boolean {
  return user?.status === "muted" || user?.status === "banned";
}
