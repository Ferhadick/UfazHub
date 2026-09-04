import type { FeedItem } from "@/types/api";
import Link from "next/link";
import type { Route } from "next";

export function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-lg border border-line bg-paper-50 py-12 text-center text-sm text-muted">No entries found.</div>;
  }

  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-paper">
      {items.map((item) => (
        <article key={`${item.kind}-${item.id}`} className="p-5 transition-colors hover:bg-paper-50 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-paper-50 px-2 py-1 capitalize">{item.kind.replaceAll("_", " ")}</span>
            <span>{item.meta}</span>
            <span>·</span>
            <span>{item.score} points</span>
          </div>
          <h3 className="text-lg font-semibold leading-6 tracking-tight sm:text-xl">
            {item.href.startsWith("/") ? (
              <Link href={item.href as Route} className="hover:text-accent">{item.title}</Link>
            ) : (
              <a href={item.href} target="_blank" rel="noreferrer" className="hover:text-accent">{item.title}</a>
            )}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{item.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href={`/profile/${item.author_username}`} className="font-medium text-ink hover:text-accent">{item.author_name}</Link>
            {item.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-paper-50 px-2 py-1">#{tag}</span>)}
          </div>
        </article>
      ))}
    </div>
  );
}
