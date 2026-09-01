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

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === "All" || normalized(item.kind) === typeFilter.toLowerCase();
      const matchesTag = tagFilter === null || item.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase());
      return matchesType && matchesTag;
    });
  }, [items, tagFilter, typeFilter]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [items]);

  useEffect(() => {
    function applyExternalFilter(event: Event) {
      const detail = (event as CustomEvent<{ tag: string }>).detail;
      if (!detail?.tag) return;
      setTypeFilter("All");
      setTagFilter(detail.tag);
      window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }

    window.addEventListener("ufaz-home-filter", applyExternalFilter);
    return () => window.removeEventListener("ufaz-home-filter", applyExternalFilter);
  }, []);

  function moveToList() {
    window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function chooseType(label: string) {
    setTypeFilter(label);
    moveToList();
  }

  function chooseTag(tag: string) {
    setTagFilter((current) => (current === tag ? null : tag));
    moveToList();
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-accent">01 / The index</div>
      <div className="mt-2 flex flex-col gap-2 border-b-4 border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-accent text-3xl uppercase">Recently shared</h2>
        <span className="text-xs text-muted">
          {visibleItems.length} of {items.length} entries
        </span>
      </div>

      <div className="border-b border-line py-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {typeFilters.map((label) => {
            const active = label === typeFilter;
            return (
              <button
                key={label}
                type="button"
                onClick={() => chooseType(label)}
                className={active ? "bg-accent px-3 py-2 font-sans font-bold text-paper shadow-[4px_4px_0_var(--color-clay)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0" : "border border-line px-3 py-2 font-sans text-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-paper/70 active:translate-y-0"}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>

        {popularTags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="mr-1 text-muted">Tags</span>
            {popularTags.map((tag) => {
              const active = tag === tagFilter;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => chooseTag(tag)}
                  className={active ? "border border-accent bg-clay px-3 py-1.5 font-sans font-bold text-accent shadow-[3px_3px_0_var(--color-accent)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0" : "border-b border-line px-1.5 py-1 text-accent transition-all duration-200 hover:-translate-y-0.5 hover:border-accent active:translate-y-0"}
                  aria-pressed={active}
                >
                  #{tag}
                </button>
              );
            })}
            {(tagFilter !== null || typeFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setTagFilter(null);
                  setTypeFilter("All");
                  moveToList();
                }}
                className="ml-1 border border-line px-3 py-1.5 font-sans text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent active:translate-y-0"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div ref={listRef} className="scroll-mt-28">
        <FeedList items={visibleItems} />
      </div>
    </div>
  );
}
