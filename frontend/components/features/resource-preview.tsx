import { ExternalLink, FileArchive, FileText, Github, Image as ImageIcon, Link2, Play } from "lucide-react";
import type { ResourceRead } from "@/types/api";

type Props = {
  resource: ResourceRead;
  compact?: boolean;
};

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function extensionFromUrl(value: string) {
  const url = safeUrl(value);
  const path = (url?.pathname ?? value).toLowerCase();
  return path.match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function youtubeEmbed(value: string) {
  const url = safeUrl(value);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  let id = "";
  if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (host.endsWith("youtube.com")) {
    id = url.searchParams.get("v") ?? "";
    if (!id && (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/"))) {
      id = url.pathname.split("/").filter(Boolean)[1] ?? "";
    }
  }
  return /^[a-zA-Z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function resourceMeta(resource: ResourceRead) {
  const url = safeUrl(resource.url);
  const ext = extensionFromUrl(resource.url);
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";
  const isText = ["txt", "md", "csv"].includes(ext);
  const isArchive = ext === "zip";
  const isGithub = url?.hostname.toLowerCase().includes("github.com") || resource.type === "github_repo";
  const youtube = youtubeEmbed(resource.url);
  const host = url?.hostname.replace(/^www\./, "") ?? "Attached resource";
  const path = url?.pathname && url.pathname !== "/" ? decodeURIComponent(url.pathname) : "";

  return { url, ext, isImage, isPdf, isText, isArchive, isGithub, youtube, host, path };
}

function MetaIcon({ resource }: { resource: ResourceRead }) {
  const meta = resourceMeta(resource);
  if (meta.isGithub) return <Github className="h-5 w-5" />;
  if (meta.youtube || resource.type === "video") return <Play className="h-5 w-5" />;
  if (meta.isImage) return <ImageIcon className="h-5 w-5" />;
  if (meta.isArchive) return <FileArchive className="h-5 w-5" />;
  if (meta.isPdf || resource.type === "docs") return <FileText className="h-5 w-5" />;
  return <Link2 className="h-5 w-5" />;
}

export function ResourcePreview({ resource, compact = false }: Props) {
  const meta = resourceMeta(resource);

  if (compact) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-w-0 items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3 transition-colors hover:border-accent/60 hover:bg-paper"
      >
        {meta.isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.url} alt="" className="h-12 w-16 shrink-0 rounded border border-line object-cover" loading="lazy" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-accent">
            <MetaIcon resource={resource} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {meta.isPdf ? "PDF document" : meta.isText ? `${meta.ext.toUpperCase()} file` : meta.isImage ? "Image" : meta.youtube ? "Video" : meta.isGithub ? "GitHub repository" : meta.host}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {meta.path || meta.host}
          </span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
      </a>
    );
  }

  if (meta.isImage) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resource.url} alt={resource.title} className="max-h-[70vh] w-full bg-paper object-contain" />
        </a>
        <PreviewFooter resource={resource} label="Open full image" />
      </div>
    );
  }

  if (meta.isPdf) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <iframe src={resource.url} title={`${resource.title} PDF preview`} className="h-[68vh] min-h-[460px] w-full bg-paper" />
        <PreviewFooter resource={resource} label="Open PDF in a new tab" />
      </div>
    );
  }

  if (meta.isText) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <iframe src={resource.url} title={`${resource.title} text preview`} className="h-[34rem] min-h-[360px] w-full bg-paper" />
        <PreviewFooter resource={resource} label="Open file in a new tab" />
      </div>
    );
  }

  if (meta.youtube) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-black">
        <div className="aspect-video">
          <iframe
            src={meta.youtube}
            title={`${resource.title} video`}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <PreviewFooter resource={resource} label="Open video source" />
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent/60 hover:bg-paper sm:p-6"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-accent">
        <MetaIcon resource={resource} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {meta.isArchive ? "Archive" : meta.isGithub ? "Repository" : resource.type === "docs" ? "Document" : "External resource"}
        </span>
        <span className="mt-1 block break-words text-lg font-semibold text-ink group-hover:text-accent">{meta.host}</span>
        {meta.path ? <span className="mt-1 block break-all text-sm leading-6 text-muted">{meta.path}</span> : null}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          Open resource <ExternalLink className="h-4 w-4" />
        </span>
      </span>
    </a>
  );
}

function PreviewFooter({ resource, label }: { resource: ResourceRead; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line bg-paper px-4 py-3">
      <span className="truncate text-xs text-muted">{safeUrl(resource.url)?.hostname.replace(/^www\./, "") ?? "Attachment"}</span>
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        {label} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
