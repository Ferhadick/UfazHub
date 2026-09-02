"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { adminOverview } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import type { AdminOverview } from "@/types/api";

function formatWhen(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    adminOverview(token)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <p className="font-sans text-sm text-accent">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <p className="font-sans text-sm text-muted">Opening the ledger...</p>
      </main>
    );
  }

  const counts = [
    ["People", data.users_total],
    ["Active", data.users_active],
    ["Muted", data.users_muted],
    ["Banned", data.users_banned],
    ["Admins", data.admins]
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:px-8">
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 md:grid-cols-5">
        {counts.map(([label, value]) => (
          <div key={label} className="bg-paper px-4 py-4 sm:py-5">
            <div className="text-xs uppercase tracking-[0.16em] text-muted">{label}</div>
            <div className="mt-1 sm:mt-2 font-accent text-3xl sm:text-4xl text-ink">{value}</div>
          </div>
        ))}
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="border-t border-line pt-4">
          <h2 className="font-accent text-2xl">Holdings</h2>
          <dl className="mt-4 space-y-2 font-sans text-sm">
            <div className="flex justify-between"><dt>Resources</dt><dd>{data.content_counts.resources}</dd></div>
            <div className="flex justify-between"><dt>Articles</dt><dd>{data.content_counts.articles}</dd></div>
            <div className="flex justify-between"><dt>Collections</dt><dd>{data.content_counts.collections}</dd></div>
          </dl>
        </div>
        <div className="border-t border-line pt-4">
          <h2 className="font-accent text-2xl">Hidden</h2>
          <dl className="mt-4 space-y-2 font-sans text-sm">
            <div className="flex justify-between"><dt>Resources</dt><dd>{data.hidden_counts.resources}</dd></div>
            <div className="flex justify-between"><dt>Articles</dt><dd>{data.hidden_counts.articles}</dd></div>
            <div className="flex justify-between"><dt>Collections</dt><dd>{data.hidden_counts.collections}</dd></div>
          </dl>
        </div>
        <div className="border-t border-line pt-4">
          <h2 className="font-accent text-2xl">Last 7 days</h2>
          <dl className="mt-4 space-y-2 font-sans text-sm">
            {Object.keys(data.events_last_7_days).length === 0 ? (
              <p className="text-muted">No tracked actions yet.</p>
            ) : (
              Object.entries(data.events_last_7_days)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between gap-4">
                    <dt className="truncate">{type.replaceAll("_", " ")}</dt>
                    <dd>{count}</dd>
                  </div>
                ))
            )}
          </dl>
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="border-t border-line pt-4 font-accent text-2xl">Recent moderation</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {data.recent_moderation_events.length === 0 ? (
              <p className="py-6 font-sans text-sm text-muted">No warnings, mutes, or bans yet.</p>
            ) : (
              data.recent_moderation_events.map((event) => (
                <Link key={event.id} href={`/admin/users/${event.user_id}` as Route} className="block py-4 hover:bg-paper/70">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted">
                    {event.event_type} / {event.actor_username ?? "admin"}
                  </div>
                  <p className="mt-1 font-sans text-sm">{event.reason}</p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(event.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="border-t border-line pt-4 font-accent text-2xl">Blocked guest attempts</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {data.recent_blocked_guest_actions.length === 0 ? (
              <p className="py-6 font-sans text-sm text-muted">No blocked guest votes or submits.</p>
            ) : (
              data.recent_blocked_guest_actions.map((event) => (
                <div key={event.id} className="py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted">{event.event_type.replaceAll("_", " ")}</div>
                  <p className="mt-1 font-sans text-sm">
                    Guest {event.guest_session_id?.slice(0, 8)} · hash {event.ip_hash ? `${event.ip_hash.slice(0, 10)}…` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(event.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
