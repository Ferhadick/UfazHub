"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { adminListUsers } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import type { UserPublic, UserRole, UserStatus } from "@/types/api";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [items, setItems] = useState<UserPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const handle = window.setTimeout(() => {
      adminListUsers(token, { q, status, role, limit: 50 })
        .then((result) => {
          setItems(result.items);
          setTotal(result.total);
          setError(null);
        })
        .catch((err: Error) => setError(err.message));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [q, status, role]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex flex-col gap-4 border-t border-line pt-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted">{total} accounts</div>
          <h2 className="mt-1 font-accent text-4xl">People</h2>
        </div>
        <Link href={"/admin/users/new" as Route} className="border border-line px-4 py-2 font-sans font-bold hover:bg-clay hover:text-accent">
          Create admin
        </Link>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email, username" className="border border-line bg-paper px-3 py-3" />
        <select value={status} onChange={(event) => setStatus(event.target.value as UserStatus | "")} className="border border-line bg-paper px-3 py-3">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="muted">Muted</option>
          <option value="banned">Banned</option>
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole | "")} className="border border-line bg-paper px-3 py-3">
          <option value="">Any role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error ? <p className="mt-4 font-sans text-sm text-accent">{error}</p> : null}

      <div className="mt-8 overflow-x-auto border-y border-line">
        <table className="w-full min-w-[44rem] text-left font-sans text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr className="border-b border-line">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Username</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-b-0 hover:bg-paper/70">
                <td className="py-3 pr-4">
                  <Link href={`/admin/users/${user.id}` as Route} className="font-bold hover:text-accent">
                    {user.name}
                  </Link>
                  <div className="text-xs text-muted">{user.email}</div>
                </td>
                <td className="py-3 pr-4">{user.username}</td>
                <td className="py-3 pr-4">{user.role}</td>
                <td className="py-3 pr-4">{user.status}</td>
                <td className="py-3">{user.warning_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
