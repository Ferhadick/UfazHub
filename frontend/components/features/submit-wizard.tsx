"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, FileUp, Link2, Paperclip, X } from "lucide-react";
import { ApiClientError, createArticle, createResource, uploadResourceFile } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";
import { MarkdownEditor } from "@/components/features/markdown-editor";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_LINKS = 10;
const MAX_FILES = 10;

function splitTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function standaloneUrl(value: string) {
  const normalized = normalizeUrl(value);
  return isHttpUrl(normalized) ? normalized : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function firstUrl(value: string) {
  const markdownLink = value.match(/\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i)?.[1];
  if (markdownLink) return markdownLink;
  const raw = value.match(/https?:\/\/[^\s)>\]]+/i)?.[0];
  return raw?.replace(/[.,;:!?]+$/, "") ?? "";
}

function inferTitle(title: string, content: string, link: string, fileName?: string) {
  if (title.trim().length >= 3) return title.trim().slice(0, 180);
  const firstLine = content.split("\n").map((line) => line.trim()).find(Boolean);
  if (firstLine && !standaloneUrl(firstLine)) {
    const cleaned = firstLine.replace(/^#{1,6}\s*/, "").replace(/^[-*>\s]+/, "").trim();
    if (cleaned.length >= 3) return cleaned.slice(0, 180);
  }
  if (fileName) {
    const base = fileName.replace(/\.[^.]+$/, "").trim();
    return (base.length >= 3 ? base : "Shared file").slice(0, 180);
  }
  if (link) {
    try {
      const url = new URL(link);
      const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
      return `${url.hostname.replace(/^www\./, "")}${path}`.slice(0, 180);
    } catch {
      return "Shared resource";
    }
  }
  return "Shared note";
}

function inferResourceType(url: string, fileName?: string) {
  const value = `${fileName ?? ""} ${url}`.toLowerCase();
  if (value.includes("github.com")) return "github_repo";
  if (/\.(pdf|doc|docx|ppt|pptx|txt|md|xls|xlsx|csv)(\?|$)/.test(value)) return "docs";
  if (/\.(mp4|webm|mov)(\?|$)/.test(value) || value.includes("youtube.com") || value.includes("youtu.be")) return "video";
  return "website";
}

function resourceDescription(content: string, title: string) {
  const cleaned = standaloneUrl(content) ? "" : content.trim();
  const fallback = `Shared resource: ${title}. Added to UFAZ Hub for other students.`;
  const value = cleaned || fallback;
  return value.length >= 20 ? value.slice(0, 2000) : `${value} Shared with the UFAZ community.`.slice(0, 2000);
}

export function SubmitWizard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [researchMode, setResearchMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ pending: boolean; href?: string; kind: "note" | "resource" } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("research") === "1") setResearchMode(true);
  }, []);

  function addLink() {
    setLinks((prev) => (prev.length < MAX_LINKS ? [...prev, ""] : prev));
  }

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addFiles(selected: FileList | null) {
    if (!selected || !selected.length) return;
    const incoming = Array.from(selected);
    const oversized = incoming.find((next) => next.size > MAX_FILE_BYTES);
    if (oversized) {
      setError("Files must be 25 MB or smaller.");
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setError("Sign in before publishing.");
      return;
    }

    const explicitLinks = links.map((raw) => normalizeUrl(raw)).filter(Boolean);
    const contentOnlyLink = standaloneUrl(content);
    const embeddedLink = firstUrl(content);
    const allLinks = explicitLinks.length ? explicitLinks : [contentOnlyLink || embeddedLink].filter(Boolean);
    const invalidLink = allLinks.find((value) => !isHttpUrl(value));

    if (!content.trim() && !allLinks.length && !files.length) {
      setError("Write something, paste a link, or attach a file.");
      return;
    }
    if (invalidLink) {
      setError("That link does not look valid. Try example.com or a full address such as https://example.com.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const uploaded: Array<Awaited<ReturnType<typeof uploadResourceFile>>> = [];
      for (const nextFile of files) {
        uploaded.push(await uploadResourceFile(token, nextFile));
      }

      const primaryUrl = allLinks[0] || uploaded[0]?.url || "";
      const finalTitle = inferTitle(title, content, primaryUrl, uploaded[0]?.filename || files[0]?.name);
      const tagList = splitTags(tags);
      if (researchMode && !tagList.some((tag) => tag.toLowerCase() === "research")) tagList.unshift("research");
      const contentIsMostlyAttachment = Boolean(primaryUrl) && (contentOnlyLink === primaryUrl || content.trim().length <= 700);

      if (primaryUrl && contentIsMostlyAttachment) {
        const created = await createResource(token, {
          title: finalTitle,
          description: resourceDescription(content, finalTitle),
          url: primaryUrl,
          type: inferResourceType(primaryUrl, uploaded[0]?.filename || files[0]?.name),
          category: researchMode ? "Research" : "General",
          difficulty: "beginner",
          tags: tagList,
          links: allLinks.map((url) => ({ url })),
          attachments: uploaded.map((item) => ({
            url: item.url,
            filename: item.filename,
            content_type: item.content_type ?? undefined,
            size_bytes: item.size
          }))
        });
        setSuccess({ pending: created.is_pending_review, href: created.is_pending_review ? undefined : `/resources/${created.id}`, kind: "resource" });
      } else {
        const attachmentLines = [
          ...allLinks.map((url) => `[Open link](${url})`),
          ...uploaded.map((item) => `[${item.filename}](${item.url})`)
        ];
        const attachment = attachmentLines.length ? `\n\n${attachmentLines.join("\n")}` : "";
        const body = `${content.trim()}${attachment}`.trim() || attachmentLines[0] || "";
        const created = await createArticle(token, {
          title: finalTitle,
          content: body,
          status: "published",
          tags: tagList
        });
        setSuccess({ pending: Boolean(created.is_pending_review), href: created.is_pending_review ? undefined : `/articles/${created.slug}`, kind: "note" });
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Could not publish this entry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-line bg-paper p-7 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-9 w-9 text-moss" />
        <h2 className="mt-4 font-accent text-2xl font-semibold">{success.pending ? "Sent for review" : "Published"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          {success.pending
            ? `Your ${success.kind} is saved. It will appear publicly after moderation.`
            : `Your ${success.kind} is now available in UFAZ Hub.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {success.href ? <Link href={success.href as Route} className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Open it</Link> : null}
          <button
            type="button"
            onClick={() => {
              setTitle(""); setContent(""); setTags(""); setLinks([]); setFiles([]); setSuccess(null);
            }}
            className="rounded border border-line bg-paper px-4 py-2.5 text-sm font-semibold hover:bg-surface"
          >
            Share another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">What are you sharing?</div>
          <div className="mt-0.5 text-xs text-muted">Research posts are collected automatically on the Research page.</div>
        </div>
        <div className="inline-flex w-fit rounded-md border border-line bg-paper p-1">
          <button type="button" onClick={() => setResearchMode(false)} className={`rounded px-3 py-1.5 text-xs font-semibold ${!researchMode ? "bg-clay text-accent" : "text-muted hover:text-ink"}`}>General</button>
          <button type="button" onClick={() => setResearchMode(true)} className={`rounded px-3 py-1.5 text-xs font-semibold ${researchMode ? "bg-clay text-accent" : "text-muted hover:text-ink"}`}>Research / project</button>
        </div>
      </div>

      <div>
        <label htmlFor="entry-title" className="mb-1.5 block text-sm font-semibold text-ink">Title <span className="font-normal text-muted">optional</span></label>
        <input
          id="entry-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a clear title, or leave this empty and we will infer one"
          maxLength={180}
          className="w-full rounded-md border border-line bg-paper px-3.5 py-3 text-base text-ink outline-none placeholder:text-muted/65 focus:border-accent focus:ring-1 focus:ring-accent/15"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="entry-content" className="text-sm font-semibold text-ink">Content</label>
          <span className="text-xs text-muted">Use #, ##, lists, links, code and more</span>
        </div>
        <MarkdownEditor
          id="entry-content"
          value={content}
          onChange={setContent}
          placeholder={researchMode
            ? "Write a short abstract, project summary, method, result or research note. Markdown is formatted live.\n\n## Abstract\nWhat did you investigate?\n\n## Results\nWhat did you find?"
            : "Write or paste your note here. Markdown is formatted live.\n\n## Exam notes\n- Important formula\n- Useful explanation\n\nYou can also paste a web link here."}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Attachments <span className="font-normal text-muted">optional</span></label>
          <div className="space-y-2">
            {files.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 text-sm">
                <Paperclip className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="text-xs text-muted">{(item.size / 1024 / 1024).toFixed(item.size > 1024 * 1024 ? 1 : 2)} MB</div>
                </div>
                <button type="button" onClick={() => removeFile(index)} className="rounded p-1 text-muted hover:bg-paper hover:text-ink" aria-label="Remove file">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES ? (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => addFiles(event.target.files)}
                />
                <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-11 w-full items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-left text-sm text-muted hover:bg-surface hover:text-ink">
                  <FileUp className="h-4 w-4" /> {files.length ? "Add another file" : "Upload PDF, document, image or ZIP"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Links <span className="font-normal text-muted">optional</span></label>
          <div className="space-y-2">
            {links.map((value, index) => (
              <div key={index} className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper px-3 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/15">
                <Link2 className="h-4 w-4 shrink-0 text-muted" />
                <input
                  type="text"
                  inputMode="url"
                  value={value}
                  onChange={(event) => updateLink(index, event.target.value)}
                  placeholder="example.com or https://..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm outline-none focus:ring-0"
                />
                <button type="button" onClick={() => removeLink(index)} className="rounded p-1 text-muted hover:bg-surface hover:text-ink" aria-label="Remove link">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {links.length < MAX_LINKS ? (
              <button type="button" onClick={addLink} className="flex min-h-11 w-full items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-left text-sm text-muted hover:bg-surface hover:text-ink">
                <Link2 className="h-4 w-4" /> {links.length ? "Add another link" : "Add a web link"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="entry-tags">Tags <span className="font-normal text-muted">optional, comma separated</span></label>
        <input
          id="entry-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="math, internship, python"
          className="w-full rounded-md border border-line bg-paper px-3.5 py-3 text-sm outline-none placeholder:text-muted/65 focus:border-accent focus:ring-1 focus:ring-accent/15"
        />
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div> : null}

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-muted">Notes keep Markdown formatting. A short post with a link or file is saved as a resource automatically.</p>
        <button type="submit" disabled={submitting} className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55">
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
}
