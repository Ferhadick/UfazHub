"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReasonModal } from "@/components/features/reason-modal";
import { Button } from "@/components/ui/button";
import {
  adminBanUser,
  adminGetUser,
  adminListContent,
  adminMuteUser,
  adminUnbanUser,
  adminUnmuteUser,
  adminUpdateUser,
  adminWarnUser
} from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";
import type { AdminContentItem, AdminUserDetail, UserPublic } from "@/types/api";

type ActionKind = "warn" | "mute" | "unmute" | "ban" | "unban" | "make_admin" | "remove_admin";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [posts, setPosts] = useState<AdminContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const selfId = getStoredUser()?.id;

  async function reload(token: string) {
    const next = await adminGetUser(token, params.id);
    setDetail(next);
    const [resources, articles, collections] = await Promise.all([
      adminListContent(token, { kind: "resource", author_id: params.id, limit: 20 }),
      adminListContent(token, { kind: "article", author_id: params.id, limit: 20 }),
      adminListContent(token, { kind: "collection", author_id: params.id, limit: 20 })
    ]);
    setPosts([...resources.items, ...articles.items, ...collections.items]);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    reload(token).catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function runAction(reason: string, durationMinutes: number | null) {
    const token = getStoredToken();
    if (!token || !detail || !action) return;
    setBusy(true);
    setError(null);
    try {
      const id = detail.user.id;
      if (action === "warn") await adminWarnUser(token, id, reason);
      if (action === "mute") await adminMuteUser(token, id, reason, durationMinutes);
      if (action === "unmute") await adminUnmuteUser(token, id, reason);
      if (action === "ban") await adminBanUser(token, id, reason);
      if (action === "unban") await adminUnbanUser(token, id, reason);
      if (action === "make_admin") await adminUpdateUser(token, id, { role: "admin", reason });
      if (action === "remove_admin") await adminUpdateUser(token, id, { role: "user", reason });
      await reload(token);
      setAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token || !detail) return;
    const form = new FormData(event.currentTarget);
    setSaveBusy(true);
    setError(null);
    try {
      await adminUpdateUser(token, detail.user.id, {
        name: String(form.get("name") ?? ""),
        username: String(form.get("username") ?? ""),
        email: String(form.get("email") ?? ""),
        faculty: String(form.get("faculty") ?? ""),
        bio: String(form.get("bio") ?? "")
      });
      await reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaveBusy(false);
    }
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <p className="font-sans text-sm text-muted">{error ?? "Loading dossier..."}</p>
      </main>
    );
  }

  const user: UserPublic = detail.user;
  const isSelf = user.id === selfId;
  const labels: Record<ActionKind, { title: string; confirm: string; duration?: boolean }> = {
    warn: { title: "Warn this account", confirm: "Record warning" },
    mute: { title: "Mute this account", confirm: "Mute", duration: true },
    unmute: { title: "Unmute this account", confirm: "Unmute" },
    ban: { title: "Ban this account", confirm: "Ban" },
    unban: { title: "Unban this account", confirm: "Unban" },
    make_admin: { title: "Promote to admin", confirm: "Make admin" },
    remove_admin: { title: "Remove admin", confirm: "Demote" }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">
          {user.role} / {user.status} / {user.warning_count} warnings
        </div>
        <h2 className="mt-2 font-accent text-3xl break-words sm:text-5xl">{user.name}</h2>
        <p className="mt-2 font-sans text-sm text-muted break-all">@{user.username} · {user.email}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setAction("warn")}>Warn</Button>
        {user.status === "muted" ? (
          <Button type="button" variant="outline" onClick={() => setAction("unmute")}>Unmute</Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setAction("mute")}>Mute</Button>
        )}
        {user.status === "banned" ? (
          <Button type="button" variant="outline" onClick={() => setAction("unban")}>Unban</Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setAction("ban")} disabled={isSelf}>Ban</Button>
        )}
        {user.role === "admin" ? (
          <Button type="button" variant="outline" onClick={() => setAction("remove_admin")} disabled={isSelf}>
            Remove admin
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setAction("make_admin")}>Make admin</Button>
        )}
      </div>

      {error ? <p className="mt-4 font-sans text-sm text-accent">{error}</p> : null}

      <form onSubmit={saveProfile} className="mt-10 grid gap-4 border-t border-line pt-6">
        <h3 className="font-accent text-2xl">Edit profile</h3>
        <label className="block font-sans text-sm font-bold">
          Name
          <input name="name" defaultValue={user.name} className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </label>
        <label className="block font-sans text-sm font-bold">
          Username
          <input name="username" defaultValue={user.username} className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </label>
        <label className="block font-sans text-sm font-bold">
          Email
          <input name="email" type="email" defaultValue={user.email} className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </label>
        <label className="block font-sans text-sm font-bold">
          Faculty
          <input name="faculty" defaultValue={user.faculty ?? ""} placeholder="Faculty" className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </label>
        <label className="block font-sans text-sm font-bold">
          Bio
          <textarea name="bio" defaultValue={user.bio ?? ""} placeholder="Bio" className="mt-1 min-h-24 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </label>
        <Button type="submit" disabled={saveBusy} className="w-full sm:w-auto">{saveBusy ? "Saving..." : "Save profile"}</Button>
      </form>

      <section className="mt-12">
        <h3 className="border-t border-line pt-5 font-accent text-2xl">Posts</h3>
        <p className="mt-2 font-sans text-sm text-muted">
          {detail.content_counts.resources} resources · {detail.content_counts.articles} articles · {detail.content_counts.collections} collections
        </p>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {posts.length === 0 ? (
            <p className="py-6 font-sans text-sm text-muted">No holdings under this name.</p>
          ) : (
            posts.map((item) => (
              <Link key={`${item.kind}-${item.id}`} href={`/admin/content/${item.kind}/${item.id}` as Route} className="block py-4 hover:bg-paper/70">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  {item.kind} {item.is_hidden ? "/ hidden" : ""}
                </div>
                <div className="mt-1 font-accent text-2xl">{item.title}</div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        <h3 className="border-t border-line pt-5 font-accent text-2xl">Moderation timeline</h3>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {detail.moderation_history.length === 0 ? (
            <p className="py-6 font-sans text-sm text-muted">Clean record.</p>
          ) : (
            detail.moderation_history.map((event) => (
              <div key={event.id} className="py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  {event.event_type} / {event.actor_username ?? "admin"}
                </div>
                <p className="mt-1 font-sans text-sm">{event.reason}</p>
                <p className="mt-1 text-xs text-muted">{new Date(event.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {action ? (
        <ReasonModal
          title={labels[action].title}
          confirmLabel={labels[action].confirm}
          showDuration={labels[action].duration}
          busy={busy}
          error={error}
          onClose={() => setAction(null)}
          onConfirm={runAction}
        />
      ) : null}
    </main>
  );
}
