"use client";

import { useEffect, useState } from "react";
import { adminListEvents } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import type { AdminActionEventRead } from "@/types/api";

const EVENT_TYPES = [
  "",
  "vote_attempt_blocked",
  "submit_attempt_blocked",
  "vote_cast",
  "login",
  "signup_completed",
  "admin_hide",
  "admin_unhide",
  "admin_delete",
  "admin_warn",
  "admin_mute",
  "admin_unmute",
  "admin_ban",
  "admin_unban",
  "admin_role_change",
  "admin_user_edit"
];

export default function AdminActivityPage() {
  const [eventType, setEventType] = useState("");
  const [actorType, setActorType] = useState<"" | "guest" | "user">("");
  const [items, setItems] = useState<AdminActionEventRead[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    adminListEvents(token, { event_type: eventType, actor_type: actorType, limit: 50 })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [eventType, actorType]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">{total} events</div>
        <h2 className="mt-1 font-accent text-3xl sm:text-4xl">Activity ledger</h2>
      </div>

      <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2">
        <select
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
          className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type || "all"} value={type}>
              {type ? type.replaceAll("_", " ") : "Any event"}
            </option>
          ))}
        </select>
        <select
          value={actorType}
          onChange={(event) => setActorType(event.target.value as typeof actorType)}
          className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        >
          <option value="">Any actor</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      {error ? <p className="mt-4 font-sans text-sm text-accent">{error}</p> : null}

      <div className="mt-8 -mx-4 overflow-x-auto border-y border-line px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[48rem] text-left font-sans text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr className="border-b border-line">
              <th className="py-3 pr-4">When</th>
              <th className="py-3 pr-4">Type</th>
              <th className="py-3 pr-4">Actor</th>
              <th className="py-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {items.map((event) => (
              <tr key={event.id} className="border-b border-line last:border-b-0">
                <td className="py-3 pr-4 whitespace-nowrap">{new Date(event.created_at).toLocaleString()}</td>
                <td className="py-3 pr-4">{event.event_type.replaceAll("_", " ")}</td>
                <td className="py-3 pr-4">
                  {event.actor_type === "user"
                    ? event.username ?? event.user_id?.slice(0, 8)
                    : `guest ${event.guest_session_id?.slice(0, 8)} · ${event.ip_hash ? `${event.ip_hash.slice(0, 10)}…` : "no hash"}`}
                </td>
                <td className="py-3">
                  {event.target_type ?? "—"} {event.target_id ? event.target_id.slice(0, 8) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
