import type { FeedItem } from "@/types/api";
import Link from "next/link";
import type { Route } from "next";

export function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <div className="border-y border-line py-12 text-center text-muted">No entries yet. The archive starts with the first useful submission.</div>;
  }

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => (
        <article
          key={`${item.kind}-${item.id}`}
          className="animate-rise grid gap-3 px-0 py-6 transition-all duration-200 even:bg-paper/70 hover:-translate-y-0.5 hover:bg-paper/80 sm:px-2 md:grid-cols-[3.5rem_1fr_3rem] md:gap-4"
          style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-line pb-2 md:block md:border-b-0 md:border-r-2 md:pb-0 md:pr-4">
            <div className="font-accent text-2xl text-accent">{String(index + 1).padStart(2, "0")}</div>
            <div className="font-body text-xs text-muted md:hidden">{item.score}</div>
          </div>
          <div className="min-w-0 font-body">
            <div className="text-xs uppercase tracking-[0.16em] text-accent">{item.kind} / {item.meta}</div>
            <h3 className="mt-2 font-accent text-xl uppercase leading-tight break-words md:text-2xl">
              {item.href.startsWith("/") ? (
                <Link href={item.href as Route} className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  {item.title}
                </Link>
              ) : (
                <a href={item.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  {item.title}
                </a>
              )}
            </h3>
            <p className="mt-2 max-w-3xl font-sans text-sm leading-6 text-muted">{item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-accent">
              <Link href={`/profile/${item.author_username}`} className="inline-flex items-center gap-1.5 font-sans font-bold text-ink transition-colors hover:text-accent">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden border border-line bg-clay font-accent text-[8px] text-accent">
                  {item.author_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                {item.author_name}
              </Link>
              {item.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
          <div className="hidden text-right font-body text-xs text-muted md:block">{item.score}</div>
        </article>
      ))}
    </div>
  );
}
