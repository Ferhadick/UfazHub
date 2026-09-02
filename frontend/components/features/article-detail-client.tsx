"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { ArticleRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { deleteArticle, voteArticle } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";

export function ArticleDetailClient({ article: initialArticle }: { article: ArticleRead }) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleRead>(initialArticle);
  const [score, setScore] = useState(initialArticle.upvotes - initialArticle.downvotes);
  const [userVote, setUserVote] = useState<number>(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const isAuthor = Boolean(currentUser && currentUser.username === article.author.username);
  const isAdmin = currentUser?.role === "admin";
  const canDelete = isAuthor || isAdmin;

  const authorInitials = article.author.name
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
      const updated = await voteArticle(token, article.slug, newVote);
      setArticle(updated);
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
      await deleteArticle(token, article.slug);
      router.push("/articles");
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
          href="/articles"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to articles
        </Link>
        <div className="text-xs uppercase tracking-[0.16em] text-muted">
          Article / {article.reading_time} min read
        </div>
      </div>

      <div>
        <h1 className="font-accent text-3xl leading-tight sm:text-5xl md:text-6xl break-words">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-4 font-sans text-lg leading-7 text-muted max-w-3xl">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Author & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-y border-line py-4">
        <Link
          href={`/profile/${article.author.username}` as Route}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-line bg-clay font-accent text-sm text-accent">
            {article.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              authorInitials
            )}
          </div>
          <div>
            <div className="font-sans font-bold text-ink group-hover:text-accent">
              {article.author.name}
            </div>
            <div className="text-xs text-muted">@{article.author.username} · {article.author.faculty ?? "UFAZ"}</div>
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
              title="Delete this article"
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

      {/* Article Body */}
      <article className="max-w-3xl whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-ink sm:text-lg sm:leading-8">
        {article.content}
      </article>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-6">
          {article.tags.map((tag) => (
            <span key={tag.id} className="border border-line px-3 py-1 text-xs text-accent font-body">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {deleteModalOpen && (
        <ReasonModal
          title="Delete article"
          description="Are you sure you want to delete this article? This action cannot be undone."
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
