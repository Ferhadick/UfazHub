"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Trash2 } from "lucide-react";
import type { CollectionRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { deleteCollection, voteCollection } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";

const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export function CollectionDetailClient({ collection: initialCollection }: { collection: CollectionRead }) {
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionRead>(initialCollection);
  const [score, setScore] = useState(initialCollection.upvotes - initialCollection.downvotes);
  const [userVote, setUserVote] = useState(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const canDelete = Boolean(currentUser && (currentUser.username === collection.author.username || currentUser.role === "admin"));
  const authorInitials = collection.author.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  async function handleVote(value: number) {
    const token = getStoredToken();
    if (!token) {
      setVoteError("Log in to vote.");
      return;
    }
    const nextVote = userVote === value ? 0 : value;
    setVoting(true);
    setVoteError(null);
    try {
      const updated = await voteCollection(token, collection.id, nextVote);
      setCollection(updated);
      setScore(updated.upvotes - updated.downvotes);
      setUserVote(nextVote);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "Vote failed.");
    } finally {
      setVoting(false);
    }
  }

  async function handleDelete() {
    const token = getStoredToken();
    if (!token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCollection(token, collection.id);
      router.push("/collections");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Collections
      </Link>

      <header className="max-w-4xl border-b border-line pb-7">
        <p className="mb-3 text-sm text-muted">{collection.items.length} resources</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{collection.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-7 text-muted">{collection.description}</p>
      </header>

      <div className="flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-center md:justify-between">
        <Link href={`/profile/${collection.author.username}` as Route} className="group flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay text-sm font-semibold text-accent">
            {collection.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={collection.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : authorInitials}
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink group-hover:text-accent">{collection.author.name}</span>
            <span className="block text-xs text-muted">@{collection.author.username}{collection.author.faculty ? ` · ${collection.author.faculty}` : ""}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="inline-flex h-10 items-center rounded border border-line bg-paper">
            <button type="button" disabled={voting} onClick={() => handleVote(1)} className={`flex h-full w-9 items-center justify-center rounded-l ${userVote === 1 ? "bg-clay text-accent" : "text-muted hover:bg-surface hover:text-ink"}`} aria-label="Upvote">
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className="min-w-10 px-2 text-center text-sm font-semibold">{score}</span>
            <button type="button" disabled={voting} onClick={() => handleVote(-1)} className={`flex h-full w-9 items-center justify-center rounded-r ${userVote === -1 ? "bg-clay text-accent" : "text-muted hover:bg-surface hover:text-ink"}`} aria-label="Downvote">
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          {canDelete ? (
            <Button type="button" variant="quiet" onClick={() => setDeleteModalOpen(true)} className="text-red-700" title="Delete collection">
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {voteError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{voteError}</p> : null}

      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold">Resources in this collection</h2>
        <div className="divide-y divide-line border-y border-line">
          {collection.items.map((item) => (
            <article key={item.resource.id} className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr_auto] sm:items-start sm:gap-4">
              <span className="text-sm font-semibold text-muted">{item.position}</span>
              <div className="min-w-0">
                <div className="mb-1 text-xs text-muted">{item.resource.type.replaceAll("_", " ")} · {difficultyLabels[item.resource.difficulty] ?? item.resource.difficulty}</div>
                <h3 className="text-lg font-semibold leading-6">
                  <Link href={`/resources/${item.resource.id}` as Route} className="hover:text-accent">{item.resource.title}</Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.resource.description}</p>
              </div>
              <a href={item.resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {collection.tags.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-6">
          {collection.tags.map((tag) => <span key={tag.id} className="text-sm text-accent">#{tag.name}</span>)}
        </div>
      ) : null}

      {deleteModalOpen ? (
        <ReasonModal
          title="Delete collection"
          description="Are you sure you want to delete this collection? This action cannot be undone."
          confirmLabel="Delete"
          busy={deleting}
          error={deleteError}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
