import type { ResourceRead } from "@/types/api";
import Link from "next/link";
import type { Route } from "next";
import { ResourcePreview } from "@/components/features/resource-preview";

const labels: Record<string, string> = {
  course: "Course",
  article: "Article",
  video: "Video",
  docs: "Document",
  github_repo: "Repository",
  website: "Website",
  book: "Book"
};

export function ResourceList({ resources }: { resources: ResourceRead[] }) {
  if (resources.length === 0) {
    return <div className="rounded-lg border border-line bg-paper-50 py-12 text-center text-sm text-muted">No resources found.</div>;
  }

  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-paper">
      {resources.map((resource) => (
        <article key={resource.id} className="p-5 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-paper-50 px-2 py-1">{labels[resource.type] ?? resource.type}</span>
            <span>{resource.category}</span>
            <span aria-hidden="true">·</span>
            <span>{resource.upvotes - resource.downvotes} points</span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
            <Link href={`/resources/${resource.id}` as Route} className="hover:text-accent">{resource.title}</Link>
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{resource.description}</p>
          <ResourcePreview resource={resource} compact />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href={`/profile/${resource.author.username}` as Route} className="font-medium text-ink hover:text-accent">{resource.author.name}</Link>
            {resource.tags.slice(0, 5).map((tag) => <span key={tag.id} className="rounded-full bg-paper-50 px-2 py-1">#{tag.name}</span>)}
          </div>
        </article>
      ))}
    </div>
  );
}
