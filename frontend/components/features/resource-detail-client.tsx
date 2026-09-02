"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, ExternalLink, Trash2, Share2, Check, Clock, Sparkles, AlertTriangle, BookOpen, User as UserIcon } from "lucide-react";
import type { ResourceRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { deleteResource, voteResource } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

type Props = {
  resource: ResourceRead;
  currentUsername?: string | null;
  isAdmin?: boolean;
};

const typeLabels: Record<string, string> = {
  course: "Course",
  article: "Article",
  video: "Video",
  docs: "Documentation",
  github_repo: "GitHub Repository",
  website: "Website",
  book: "Book"
};

export function ResourceDetailClient({ resource: initialResource, currentUsername, isAdmin }: Props) {
  const router = useRouter();
  const [resource, setResource] = useState<ResourceRead>(initialResource);
  const [score, setScore] = useState(initialResource.upvotes - initialResource.downvotes);
  const [userVote, setUserVote] = useState<number>(0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAuthor = Boolean(currentUsername && currentUsername === resource.author.username);
  const canDelete = isAuthor || Boolean(isAdmin);

  const authorInitials = resource.author.name
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
      const updated = await voteResource(token, resource.id, newVote);
      setResource(updated);
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
      await deleteResource(token, resource.id);
      router.push("/resources");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  function handleCopy() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-10">
      {/* Back button & Meta badge bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to index
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="border border-line bg-clay/60 px-3 py-1 font-sans uppercase tracking-wider text-accent font-bold">
            {typeLabels[resource.type] || resource.type}
          </span>
          <span className="border border-line bg-paper px-3 py-1 font-sans uppercase tracking-wider text-muted">
            {resource.difficulty}
          </span>
          <span className="border border-line bg-paper px-3 py-1 font-sans uppercase tracking-wider text-muted">
            {resource.category}
          </span>
        </div>
      </div>

      {/* Main Header / Title */}
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted">
          Resource #{resource.id.slice(0, 8)} · Added {new Date(resource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <h1 className="mt-3 font-accent text-3xl leading-tight md:text-5xl lg:text-6xl break-words">
          {resource.title}
        </h1>
      </div>

      {/* Author & Action Bar */}
      <div className="grid gap-6 rounded-none border border-line bg-paper/50 p-6 md:grid-cols-[1fr_auto] md:items-center">
        {/* Author info */}
        <Link
          href={`/profile/${resource.author.username}` as Route}
          className="group flex items-center gap-4 transition-colors"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-line bg-clay font-accent text-lg text-accent overflow-hidden">
            {resource.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resource.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              authorInitials
            )}
          </div>
          <div className="min-w-0">
            <div className="font-sans font-bold text-ink group-hover:text-accent flex items-center gap-2">
              {resource.author.name}
              <span className="text-xs font-normal text-muted">@{resource.author.username}</span>
            </div>
            <div className="text-xs text-muted">
              {resource.author.faculty ?? "UFAZ Student"} · {resource.author.reputation_score} rep
            </div>
          </div>
        </Link>

        {/* Voting & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Vote Controls */}
          <div className="flex items-center border border-line bg-paper">
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote(1)}
              className={`p-2 transition-colors ${
                userVote === 1 ? "bg-accent text-paper" : "text-ink hover:bg-clay hover:text-accent"
              }`}
              title="Upvote"
              aria-label="Upvote"
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
              aria-label="Downvote"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Share / Copy link */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share"}
          </Button>

          {/* Primary External Visit Link */}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-accent bg-accent px-5 py-2.5 font-sans text-sm font-bold text-paper shadow-[3px_3px_0_var(--color-clay)] transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-clay)]"
          >
            Visit Resource <ExternalLink className="h-4 w-4" />
          </a>

          {/* Author / Admin Delete */}
          {canDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(true)}
              className="text-red-700 hover:border-red-700 hover:bg-red-50 hover:text-red-800"
              title="Delete this resource"
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

      {/* Resource Overview / Why use this */}
      <section className="space-y-3 border-y border-line py-8">
        <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">01 / Why a student should open this</div>
        <p className="max-w-4xl font-sans text-base leading-8 text-ink sm:text-lg">
          {resource.description}
        </p>
      </section>

      {/* Student Context Grid */}
      {(resource.use_case || resource.time_commitment || resource.prerequisites || resource.best_part || resource.warning || resource.student_note) && (
        <section className="space-y-6">
          <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">02 / Student Context & Field Notes</div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {resource.use_case && (
              <div className="border border-line bg-paper p-5">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <Sparkles className="h-4 w-4 shrink-0" /> Best for
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink">{resource.use_case}</p>
              </div>
            )}

            {resource.time_commitment && (
              <div className="border border-line bg-paper p-5">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <Clock className="h-4 w-4 shrink-0" /> Time commitment
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink">{resource.time_commitment}</p>
              </div>
            )}

            {resource.prerequisites && (
              <div className="border border-line bg-paper p-5">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <BookOpen className="h-4 w-4 shrink-0" /> Prerequisites
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink">{resource.prerequisites}</p>
              </div>
            )}

            {resource.best_part && (
              <div className="border border-line bg-paper p-5">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <Sparkles className="h-4 w-4 shrink-0" /> Best part / timestamp
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink">{resource.best_part}</p>
              </div>
            )}

            {resource.warning && (
              <div className="border border-line bg-paper p-5 md:col-span-2 border-l-4 border-l-accent">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Watch out / Caveat
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink">{resource.warning}</p>
              </div>
            )}

            {resource.student_note && (
              <div className="border border-line bg-clay/30 p-5 md:col-span-2 border-l-4 border-l-clay">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-accent font-bold">
                  <UserIcon className="h-4 w-4 shrink-0" /> Personal note from contributor
                </div>
                <p className="mt-2 font-sans text-sm leading-6 text-ink italic">
                  &ldquo;{resource.student_note}&rdquo;
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tags */}
      {resource.tags.length > 0 && (
        <section className="border-t border-line pt-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted">Tags</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/resources?q=${encodeURIComponent(tag.name)}`}
                className="border border-line bg-paper px-3 py-1 font-body text-xs text-accent transition-colors hover:border-accent hover:bg-clay"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* External link CTA box */}
      <div className="mt-12 flex flex-col items-center justify-between gap-6 border-4 border-line bg-paper p-8 text-center sm:flex-row sm:text-left">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">Ready to explore?</div>
          <h3 className="mt-1 font-accent text-2xl uppercase">Open resource in new tab</h3>
          <p className="mt-1 max-w-xl font-sans text-xs text-muted truncate">{resource.url}</p>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-accent bg-accent px-6 py-3 font-sans text-sm font-bold text-paper shadow-[3px_3px_0_var(--color-clay)] hover:-translate-y-0.5"
        >
          Open link <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Deletion confirmation modal */}
      {deleteModalOpen && (
        <ReasonModal
          title="Delete this resource entry"
          description="Are you sure you want to delete this resource? This action cannot be undone."
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
