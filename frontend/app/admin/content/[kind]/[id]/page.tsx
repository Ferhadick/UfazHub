"use client";

import { useParams, useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ArticleForm } from "@/components/features/article-form";
import { CollectionForm } from "@/components/features/collection-form";
import { ReasonModal } from "@/components/features/reason-modal";
import { ResourceForm } from "@/components/features/resource-form";
import { Button } from "@/components/ui/button";
import {
  adminDeleteContent,
  adminGetContent,
  adminHideContent,
  adminUnhideContent,
  adminUpdateContent
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import type { AdminArticleRead, AdminCollectionRead, AdminResourceRead, ContentKind } from "@/types/api";

export default function AdminContentEditPage() {
  const params = useParams<{ kind: ContentKind; id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<AdminResourceRead | AdminArticleRead | AdminCollectionRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"hide" | "unhide" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const token = getStoredToken();
    if (!token) return;
    const next = await adminGetContent(token, params.kind, params.id);
    setItem(next);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [params.kind, params.id]);

  async function confirm(reason: string) {
    const token = getStoredToken();
    if (!token || !pending) return;
    setBusy(true);
    setError(null);
    try {
      if (pending === "hide") await adminHideContent(token, params.kind, params.id, reason);
      if (pending === "unhide") await adminUnhideContent(token, params.kind, params.id, reason);
      if (pending === "delete") {
        await adminDeleteContent(token, params.kind, params.id);
        router.push("/admin/content" as Route);
        return;
      }
      await reload();
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <p className="font-sans text-sm text-muted">{error ?? "Loading record..."}</p>
      </main>
    );
  }

  const hidden = "is_hidden" in item ? item.is_hidden : false;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">
          {params.kind} {hidden ? "/ hidden" : "/ public"}
        </div>
        <h2 className="mt-2 font-accent text-4xl">{item.title}</h2>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {hidden ? (
          <Button type="button" variant="outline" onClick={() => setPending("unhide")}>Unhide</Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setPending("hide")}>Hide</Button>
        )}
        <Button type="button" variant="outline" onClick={() => setPending("delete")}>Delete</Button>
      </div>
      {error ? <p className="mt-4 font-sans text-sm text-accent">{error}</p> : null}

      <div className="mt-10">
        {params.kind === "resource" && "url" in item ? (
          <ResourceForm
            submitLabel="Save resource"
            initial={{
              title: item.title,
              description: item.description,
              url: item.url,
              type: item.type,
              category: item.category,
              difficulty: item.difficulty,
              use_case: item.use_case ?? undefined,
              time_commitment: item.time_commitment ?? undefined,
              prerequisites: item.prerequisites ?? undefined,
              best_part: item.best_part ?? undefined,
              warning: item.warning ?? undefined,
              student_note: item.student_note ?? undefined,
              tags: item.tags.map((tag) => tag.name).join(", ")
            }}
            onSave={async (payload) => {
              const token = getStoredToken();
              if (!token) return;
              await adminUpdateContent(token, "resource", params.id, payload);
              await reload();
            }}
          />
        ) : null}
        {params.kind === "article" && "content" in item ? (
          <ArticleForm
            submitLabel="Save article"
            initial={{
              title: item.title,
              content: item.content,
              excerpt: item.excerpt,
              status: item.status,
              tags: item.tags.map((tag) => tag.name).join(", ")
            }}
            onSave={async (payload) => {
              const token = getStoredToken();
              if (!token) return;
              await adminUpdateContent(token, "article", params.id, payload);
              await reload();
            }}
          />
        ) : null}
        {params.kind === "collection" && "items" in item ? (
          <CollectionForm
            submitLabel="Save collection"
            initial={{
              title: item.title,
              description: item.description,
              tags: item.tags.map((tag) => tag.name).join(", "),
              resources: item.items.map((entry) => entry.resource)
            }}
            onSave={async (payload) => {
              const token = getStoredToken();
              if (!token) return;
              await adminUpdateContent(token, "collection", params.id, payload);
              await reload();
            }}
          />
        ) : null}
      </div>

      {pending ? (
        <ReasonModal
          title={pending === "delete" ? "Hard-delete this record" : pending === "hide" ? "Hide from the public archive" : "Restore to the public archive"}
          confirmLabel={pending === "delete" ? "Delete" : pending === "hide" ? "Hide" : "Unhide"}
          busy={busy}
          error={error}
          onClose={() => setPending(null)}
          onConfirm={(reason) => confirm(reason)}
        />
      ) : null}
    </main>
  );
}
