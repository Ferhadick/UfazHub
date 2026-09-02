"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ReasonModal } from "@/components/features/reason-modal";
import { Button } from "@/components/ui/button";
import { adminDeleteContent, adminHideContent, adminListContent, adminUnhideContent } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import type { AdminContentItem, ContentKind } from "@/types/api";

export default function AdminContentPage() {
  const [kind, setKind] = useState<ContentKind>("resource");
  const [q, setQ] = useState("");
  const [hidden, setHidden] = useState<"all" | "true" | "false">("all");
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ item: AdminContentItem; action: "hide" | "unhide" | "delete" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(token: string) {
    const result = await adminListContent(token, {
      kind,
      q,
      hidden: hidden === "all" ? undefined : hidden === "true",
      limit: 50
    });
    setItems(result.items);
    setTotal(result.total);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const handle = window.setTimeout(() => {
      load(token).catch((err: Error) => setError(err.message));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [kind, q, hidden]);

  async function confirm(reason: string) {
    const token = getStoredToken();
    if (!token || !pending) return;
    setBusy(true);
    setError(null);
    try {
      if (pending.action === "hide") await adminHideContent(token, pending.item.kind, pending.item.id, reason);
      if (pending.action === "unhide") await adminUnhideContent(token, pending.item.kind, pending.item.id, reason);
      if (pending.action === "delete") await adminDeleteContent(token, pending.item.kind, pending.item.id);
      await load(token);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">{total} records</div>
        <h2 className="mt-1 font-accent text-3xl sm:text-4xl">Holdings</h2>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["resource", "article", "collection"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setKind(tab)}
            className={`border px-3.5 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              kind === tab ? "border-accent bg-accent font-bold text-paper shadow-[3px_3px_0_var(--color-clay)]" : "border-line bg-paper text-ink hover:border-accent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search title"
          className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        <select
          value={hidden}
          onChange={(event) => setHidden(event.target.value as typeof hidden)}
          className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        >
          <option value="all">Visible and hidden</option>
          <option value="false">Visible only</option>
          <option value="true">Hidden only</option>
        </select>
      </div>

      {error ? <p className="mt-4 font-sans text-sm text-accent">{error}</p> : null}

      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.length === 0 ? (
          <p className="py-8 font-sans text-sm text-muted">Nothing in this drawer.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto]">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  {item.kind} {item.is_hidden ? "/ hidden" : ""} / @{item.author_username}
                </div>
                <h3 className="mt-1 font-accent text-2xl">
                  <Link href={`/admin/content/${item.kind}/${item.id}` as Route} className="hover:text-accent">
                    {item.title}
                  </Link>
                </h3>
                {item.hidden_reason ? <p className="mt-1 font-sans text-sm text-muted">{item.hidden_reason}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 self-start">
                {item.is_hidden ? (
                  <Button type="button" variant="outline" onClick={() => setPending({ item, action: "unhide" })}>
                    Unhide
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setPending({ item, action: "hide" })}>
                    Hide
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setPending({ item, action: "delete" })}>
                  Delete
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      {pending ? (
        <ReasonModal
          title={pending.action === "delete" ? "Hard-delete this record" : pending.action === "hide" ? "Hide from the public archive" : "Restore to the public archive"}
          confirmLabel={pending.action === "delete" ? "Delete" : pending.action === "hide" ? "Hide" : "Unhide"}
          busy={busy}
          error={error}
          onClose={() => setPending(null)}
          onConfirm={(reason) => confirm(reason)}
        />
      ) : null}
    </main>
  );
}
