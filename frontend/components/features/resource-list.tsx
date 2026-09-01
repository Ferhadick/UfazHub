import type { ResourceRead } from "@/types/api";
import Link from "next/link";

const labels: Record<string, string> = {
  course: "Course",
  article: "Article",
  video: "Video",
  docs: "Docs",
  github_repo: "Repository",
  website: "Website",
  book: "Book"
};

function metadata(resource: ResourceRead): string {
  if (resource.type === "video") return "24 min watch";
  if (resource.type === "course") return "12 modules";
  if (resource.type === "github_repo") return "42 projects";
  if (resource.type === "book") return "Reference";
  return resource.difficulty;
}

export function ResourceList({ resources }: { resources: ResourceRead[] }) {
  if (resources.length === 0) {
    return (
      <div className="border-y border-line py-12 text-center text-muted">
        No entries yet. The archive starts with the first useful submission.
      </div>
    );
  }

  return (
    <div className="divide-y divide-line border-y border-line">
      {resources.map((resource, index) => (
        <article key={resource.id} className="grid gap-4 py-6 transition-colors hover:bg-paper/70 md:grid-cols-[4rem_1fr_8rem]">
          <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted">
              {labels[resource.type]} / {metadata(resource)}
            </div>
            <h3 className="mt-2 font-accent text-3xl leading-tight">
              <a href={resource.url} target="_blank" rel="noreferrer">
                {resource.title}
              </a>
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{resource.description}</p>
            {(resource.use_case || resource.time_commitment || resource.best_part || resource.warning || resource.student_note) && (
              <div className="mt-4 grid gap-3 border-l-4 border-line pl-4 font-sans text-sm leading-6 text-muted md:grid-cols-2">
                {resource.use_case ? (
                  <div>
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-accent">Best for</span>
                    <p>{resource.use_case}</p>
                  </div>
                ) : null}
                {resource.time_commitment ? (
                  <div>
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-accent">Time</span>
                    <p>{resource.time_commitment}</p>
                  </div>
                ) : null}
                {resource.best_part ? (
                  <div className="md:col-span-2">
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-accent">Best part</span>
                    <p>{resource.best_part}</p>
                  </div>
                ) : null}
                {resource.warning ? (
                  <div className="md:col-span-2">
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-accent">Watch out</span>
                    <p>{resource.warning}</p>
                  </div>
                ) : null}
                {resource.student_note ? (
                  <div className="md:col-span-2">
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-accent">Student note</span>
                    <p>{resource.student_note}</p>
                  </div>
                ) : null}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
              <Link href={`/profile/${resource.author.username}`} className="border-b border-transparent font-sans font-bold text-ink transition-colors hover:border-accent hover:text-accent">
                {resource.author.name}
              </Link>
              {resource.tags.map((tag) => (
                <span key={tag.id} className="border border-line px-2 py-1">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right font-accent text-2xl">{resource.upvotes - resource.downvotes}</div>
        </article>
      ))}
    </div>
  );
}
