"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Trash2 } from "lucide-react";
import type { ArticleRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { MarkdownContent } from "@/components/features/markdown-content";
import { deleteArticle, voteArticle } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";

export function ArticleDetailClient({ article: initialArticle }: { article: ArticleRead }) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleRead>(initialArticle);
  const [score, setScore] = useState(initialArticle.upvotes - initialArticle.downvotes);
  const [userVote, setUserVote] = useState(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const isAuthor = Boolean(currentUser && currentUser.username === article.author.username);
  const canDelete = isAuthor || currentUser?.role === "admin";
  const authorInitials = article.author.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

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
      const updated = await voteArticle(token, article.slug, nextVote);
      setArticle(updated);
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
      await deleteArticle(token, article.slug);
      router.push("/articles");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Notes
      </Link>

      <header className="max-w-4xl border-b border-line pb-7">
        <div className="mb-3 text-sm text-muted">{article.reading_time} min read</div>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">{article.title}</h1>
        {article.excerpt ? <p className="mt-4 max-w-3xl text-lg leading-7 text-muted">{article.excerpt}</p> : null}
      </header>

      <div className="flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-center md:justify-between">
        <Link href={`/profile/${article.author.username}` as Route} className="group flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay text-sm font-semibold text-accent">
            {article.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : authorInitials}
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink group-hover:text-accent">{article.author.name}</span>
            <span className="block text-xs text-muted">@{article.author.username}{article.author.faculty ? ` · ${article.author.faculty}` : ""}</span>
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
            <Button type="button" variant="quiet" onClick={() => setDeleteModalOpen(true)} className="text-red-700" title="Delete note">
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {voteError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{voteError}</p> : null}

      <article className="max-w-3xl break-words text-base text-ink sm:text-lg">
        <MarkdownContent content={article.content} />
      </article>

      {article.tags.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-6">
          {article.tags.map((tag) => <span key={tag.id} className="text-sm text-accent">#{tag.name}</span>)}
        </div>
      ) : null}

      {deleteModalOpen ? (
        <ReasonModal
          title="Delete note"
          description="Are you sure you want to delete this note? This action cannot be undone."
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
