"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ExternalLink, Link2, Paperclip, Share2, Trash2 } from "lucide-react";
import type { ResourceRead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ReasonModal } from "@/components/features/reason-modal";
import { MarkdownContent } from "@/components/features/markdown-content";
import { ResourcePreview } from "@/components/features/resource-preview";
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
  docs: "Document",
  github_repo: "GitHub repository",
  website: "Website",
  book: "Book"
};

const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export function ResourceDetailClient({ resource: initialResource, currentUsername, isAdmin }: Props) {
  const router = useRouter();
  const [resource, setResource] = useState<ResourceRead>(initialResource);
  const [score, setScore] = useState(initialResource.upvotes - initialResource.downvotes);
  const [userVote, setUserVote] = useState(0);
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
      setVoteError("Log in to vote.");
      return;
    }
    const nextVote = userVote === value ? 0 : value;
    setVoting(true);
    setVoteError(null);
    try {
      const updated = await voteResource(token, resource.id, nextVote);
      setResource(updated);
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
      await deleteResource(token, resource.id);
      router.push("/resources");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  async function handleCopy() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const showExtras = resource.links.length + resource.attachments.length > 1;

  const contextItems = [
    ["Best for", resource.use_case],
    ["Time needed", resource.time_commitment],
    ["Prerequisites", resource.prerequisites],
    ["Best part", resource.best_part],
    ["Watch out", resource.warning],
    ["Contributor note", resource.student_note]
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <div className="space-y-8">
      <Link href="/resources" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Resources
      </Link>

      <header className="border-b border-line pb-7">
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span>{typeLabels[resource.type] ?? resource.type}</span>
          <span aria-hidden="true">·</span>
          <span>{resource.category}</span>
          <span aria-hidden="true">·</span>
          <span>{difficultyLabels[resource.difficulty] ?? resource.difficulty}</span>
        </div>
        <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
          {resource.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          Added {new Date(resource.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>

      <div className="flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-center md:justify-between">
        <Link href={`/profile/${resource.author.username}` as Route} className="group flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay text-sm font-semibold text-accent">
            {resource.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resource.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : authorInitials}
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink group-hover:text-accent">{resource.author.name}</span>
            <span className="block text-xs text-muted">@{resource.author.username}{resource.author.faculty ? ` · ${resource.author.faculty}` : ""}</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-10 items-center rounded border border-line bg-paper">
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote(1)}
              className={`flex h-full w-9 items-center justify-center rounded-l ${userVote === 1 ? "bg-clay text-accent" : "text-muted hover:bg-surface hover:text-ink"}`}
              aria-label="Upvote"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className="min-w-10 px-2 text-center text-sm font-semibold">{score}</span>
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote(-1)}
              className={`flex h-full w-9 items-center justify-center rounded-r ${userVote === -1 ? "bg-clay text-accent" : "text-muted hover:bg-surface hover:text-ink"}`}
              aria-label="Downvote"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Share"}
          </Button>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Open resource <ExternalLink className="h-4 w-4" />
          </a>
          {canDelete ? (
            <Button type="button" variant="quiet" onClick={() => setDeleteModalOpen(true)} className="text-red-700" title="Delete resource">
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {voteError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{voteError}</p> : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Preview</h2>
          <span className="text-xs text-muted">View the resource without leaving UFAZ Hub when the format supports it.</span>
        </div>
        <ResourcePreview resource={resource} />
      </section>

      {showExtras ? (
        <section className="border-t border-line pt-7">
          <h2 className="mb-4 font-serif text-2xl font-semibold">Links &amp; attachments</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {resource.links.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3 transition-colors hover:border-accent/60 hover:bg-paper"
              >
                <Link2 className="h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.label || item.url}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
              </a>
            ))}
            {resource.attachments.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3 transition-colors hover:border-accent/60 hover:bg-paper"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.filename}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-line pt-7">
        <h2 className="mb-4 font-serif text-2xl font-semibold">About this resource</h2>
        <MarkdownContent content={resource.description} className="max-w-4xl text-base sm:text-lg" />
      </section>

      {contextItems.length ? (
        <section className="border-t border-line pt-7">
          <h2 className="font-serif text-2xl font-semibold">Student context</h2>
          <dl className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {contextItems.map(([label, value]) => (
              <div key={label} className="border-t border-line pt-3">
                <dt className="text-sm font-semibold text-ink">{label}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {resource.tags.length ? (
        <section className="border-t border-line pt-6">
          <h2 className="text-sm font-semibold text-ink">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {resource.tags.map((tag) => (
              <Link key={tag.id} href={`/resources?q=${encodeURIComponent(tag.name)}`} className="text-sm text-accent hover:underline">
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {deleteModalOpen ? (
        <ReasonModal
          title="Delete resource"
          description="Are you sure you want to delete this resource? This action cannot be undone."
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
