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
        // Keep the last successful list visible.
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search collections"
          className="w-full rounded-md border border-line bg-paper py-3 pl-10 pr-24 text-sm outline-none focus:border-accent"
        />
        {loading ? <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">Searching...</span> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {collections.length === 0 ? (
          <div className="col-span-full rounded-lg border border-line bg-paper-50 p-10 text-center text-sm text-muted">No collections found.</div>
        ) : collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.id}` as Route} className="rounded-lg border border-line bg-paper p-5 transition-colors hover:border-accent hover:bg-paper-50">
            <div className="flex items-center justify-between gap-3 text-xs text-muted">
              <span>{collection.items.length} resources</span>
              <span>{collection.upvotes - collection.downvotes} points</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight">{collection.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{collection.description}</p>
            <div className="mt-4 text-xs text-muted">by <span className="font-medium text-ink">{collection.author.name}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
