"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search } from "lucide-react";
import type { CollectionRead } from "@/types/api";
import { listCollections } from "@/lib/api";

export function CollectionIndex({ initialCollections }: { initialCollections: CollectionRead[] }) {
  const [collections, setCollections] = useState<CollectionRead[]>(initialCollections);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listCollections(50, query.trim() || undefined);
        setCollections(res.items);
      } catch {
        // keep old list on error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections by title or description..."
          className="w-full border border-line bg-paper pl-10 pr-4 py-3 font-body text-sm transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted font-sans animate-pulse">
            Searching...
          </span>
        )}
      </div>

      {/* Results summary */}
      {query && (
        <div className="font-sans text-xs text-muted">
          {collections.length} result{collections.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-line border-y border-line">
        {collections.length === 0 ? (
          <div className="py-12 text-center text-muted font-sans text-sm">
            {query ? `No collections match "${query}".` : "No collections yet."}
          </div>
        ) : (
          collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}` as Route}
              className="grid gap-3 py-6 transition-colors hover:bg-paper/70 md:grid-cols-[4rem_1fr_8rem] md:gap-4"
            >
              <div className="flex items-baseline justify-between gap-4 md:block">
                <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
                <div className="font-accent text-2xl md:hidden">{collection.upvotes - collection.downvotes}</div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                  <span>Collection / {collection.items.length} resources</span>
                </div>
                <h2 className="mt-2 font-accent text-2xl break-words md:text-3xl">{collection.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{collection.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted font-sans">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden border border-line bg-clay font-accent text-[8px] text-accent">
                    {collection.author.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={collection.author.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      collection.author.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
                    )}
                  </span>
                  {collection.author.name}
                </div>
              </div>
              <div className="hidden text-right font-accent text-2xl md:block">{collection.upvotes - collection.downvotes}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
