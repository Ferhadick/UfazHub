"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminCreateUser } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

export default function NewAdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const created = await adminCreateUser(token, {
        email: String(form.get("email") ?? ""),
        username: String(form.get("username") ?? ""),
        password: String(form.get("password") ?? ""),
        name: String(form.get("name") ?? ""),
        faculty: String(form.get("faculty") ?? "") || undefined
      });
      router.push(`/admin/users/${created.id}` as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create admin");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Desk / New admin</div>
        <h2 className="mt-2 font-accent text-4xl">Hand someone the keys.</h2>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input name="email" type="email" required placeholder="Email" className="w-full border border-line bg-paper px-3 py-3" />
        <input name="username" required minLength={3} placeholder="Username" className="w-full border border-line bg-paper px-3 py-3" />
        <input name="name" required minLength={2} placeholder="Name" className="w-full border border-line bg-paper px-3 py-3" />
        <input name="faculty" placeholder="Faculty (optional)" className="w-full border border-line bg-paper px-3 py-3" />
        <input name="password" type="password" required minLength={8} placeholder="Password" className="w-full border border-line bg-paper px-3 py-3" />
        {error ? <p className="font-sans text-sm text-accent">{error}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create admin"}
        </Button>
      </form>
    </main>
  );
}
