"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FeedList } from "@/components/features/feed-list";
import type { FeedItem } from "@/types/api";

const typeFilters = ["All", "Article", "Course", "Repository", "Video", "Collection"];

function normalized(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export function HomeFeedSection({ items }: { items: FeedItem[] }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesType = typeFilter === "All" || normalized(item.kind) === typeFilter.toLowerCase();
    const matchesTag = tagFilter === null || item.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase());
    return matchesType && matchesTag;
  }), [items, tagFilter, typeFilter]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([tag]) => tag);
  }, [items]);

  useEffect(() => {
    function applyExternalFilter(event: Event) {
      const detail = (event as CustomEvent<{ tag: string }>).detail;
      if (!detail?.tag) return;
      setTypeFilter("All");
      setTagFilter(detail.tag);
      window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
    window.addEventListener("ufaz-home-filter", applyExternalFilter);
    return () => window.removeEventListener("ufaz-home-filter", applyExternalFilter);
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recently shared</h2>
          <p className="mt-1 text-sm text-muted">Notes and resources from the community.</p>
        </div>
        <span className="text-xs text-muted">{visibleItems.length} items</span>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {typeFilters.map((label) => {
          const active = label === typeFilter;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setTypeFilter(label)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? "border-accent bg-clay text-accent" : "border-line text-muted hover:text-ink"}`}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
        {popularTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setTagFilter((current) => current === tag ? null : tag)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${tagFilter === tag ? "border-accent bg-clay text-accent" : "border-line text-muted hover:text-ink"}`}
          >
            #{tag}
          </button>
        ))}
        {(tagFilter || typeFilter !== "All") ? (
          <button type="button" onClick={() => { setTagFilter(null); setTypeFilter("All"); }} className="px-2 py-1.5 text-xs text-accent hover:underline">Clear</button>
        ) : null}
      </div>

      <div ref={listRef} className="scroll-mt-24">
        <FeedList items={visibleItems} />
      </div>
    </div>
  );
}
