"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, ExternalLink } from "lucide-react";
import type { CollectionRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { deleteCollection, voteCollection } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";

export function CollectionDetailClient({ collection: initialCollection }: { collection: CollectionRead }) {
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionRead>(initialCollection);
  const [score, setScore] = useState(initialCollection.upvotes - initialCollection.downvotes);
  const [userVote, setUserVote] = useState<number>(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const isAuthor = Boolean(currentUser && currentUser.username === collection.author.username);
  const isAdmin = currentUser?.role === "admin";
  const canDelete = isAuthor || isAdmin;

  const authorInitials = collection.author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleVote(value: number) {
    const token = getStoredToken();
    if (!token) {
      setVoteError("Log in to vote and build reputation.");
      return;
    }
    const newVote = userVote === value ? 0 : value;
    setVoting(true);
    setVoteError(null);
    try {
      const updated = await voteCollection(token, collection.id, newVote);
      setCollection(updated);
      setScore(updated.upvotes - updated.downvotes);
      setUserVote(newVote);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "Vote failed");
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
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to collections
        </Link>
        <div className="text-xs uppercase tracking-[0.16em] text-muted">
          Collection / {collection.items.length} resources
        </div>
      </div>

      <div>
        <h1 className="font-accent text-3xl leading-tight sm:text-5xl md:text-6xl break-words">
          {collection.title}
        </h1>
        <p className="mt-4 font-sans text-lg leading-7 text-muted max-w-3xl">
          {collection.description}
        </p>
      </div>

      {/* Author & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-y border-line py-4">
        <Link
          href={`/profile/${collection.author.username}` as Route}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-line bg-clay font-accent text-sm text-accent">
            {collection.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={collection.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              authorInitials
            )}
          </div>
          <div>
            <div className="font-sans font-bold text-ink group-hover:text-accent">
              {collection.author.name}
            </div>
            <div className="text-xs text-muted">@{collection.author.username} · {collection.author.faculty ?? "UFAZ"}</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Voting */}
          <div className="flex items-center border border-line bg-paper">
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote(1)}
              className={`p-2 transition-colors ${
                userVote === 1 ? "bg-accent text-paper" : "text-ink hover:bg-clay hover:text-accent"
              }`}
              title="Upvote"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className="px-3 font-accent text-base min-w-[2.5rem] text-center">
              {score}
            </span>
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote(-1)}
              className={`p-2 transition-colors ${
                userVote === -1 ? "bg-accent text-paper" : "text-ink hover:bg-clay hover:text-accent"
              }`}
              title="Downvote"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {canDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(true)}
              className="text-red-700 hover:border-red-700 hover:bg-red-50 hover:text-red-800"
              title="Delete this collection"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {voteError && (
        <p className="border border-line bg-clay/40 p-3 font-sans text-xs text-accent">
          {voteError}
        </p>
      )}

      {/* Collection items */}
      <div className="divide-y divide-line border-y border-line">
        {collection.items.map((item) => (
          <div
            key={item.resource.id}
            className="grid grid-cols-[2.5rem_1fr] gap-3 py-6 transition-colors hover:bg-paper/70 sm:grid-cols-[4rem_1fr] sm:gap-4"
          >
            <div className="font-accent text-xl text-accent sm:text-2xl">{String(item.position).padStart(2, "0")}</div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{item.resource.type.replaceAll("_", " ")} / {item.resource.difficulty}</span>
                <a
                  href={item.resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 border border-line bg-paper px-2 py-0.5 text-[10px] text-muted hover:border-accent hover:text-accent"
                >
                  Link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <h2 className="mt-1 font-accent text-2xl leading-tight break-words sm:text-3xl">
                <Link href={`/resources/${item.resource.id}` as Route} className="transition-colors hover:text-accent">
                  {item.resource.title}
                </Link>
              </h2>
              <p className="mt-2 font-sans text-sm leading-6 text-muted">{item.resource.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-6">
          {collection.tags.map((tag) => (
            <span key={tag.id} className="border border-line px-3 py-1 text-xs text-accent font-body">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {deleteModalOpen && (
        <ReasonModal
          title="Delete collection"
          description="Are you sure you want to delete this collection? This action cannot be undone."
          confirmLabel="Yes, Delete"
          busy={deleting}
          error={deleteError}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => handleDelete()}
        />
      )}
    </div>
  );
}
