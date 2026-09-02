"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { searchArchive } from "@/lib/api";
import type { FeedItem } from "@/types/api";
import { Button } from "@/components/ui/button";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedItem[]>([]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener("ufaz-open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("ufaz-open-search", onOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      searchArchive(query)
        .then((items) => setResults(items))
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-start bg-ink/50 px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-4 sm:pt-20 backdrop-blur-xs animate-rise"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col border border-line bg-paper shadow-2xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the archive..."
            className="w-full bg-transparent font-sans text-base outline-none placeholder:text-muted/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-xs text-muted hover:text-ink"
              aria-label="Clear query"
            >
              Clear
            </button>
          ) : null}
          <Button variant="quiet" onClick={() => setOpen(false)} aria-label="Close search" className="shrink-0 p-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center font-sans text-sm text-muted">
              {query.trim() ? "No matching entries found." : "Search resources, notes, tools, and course material."}
            </div>
          ) : (
            results.map((result) => {
              const isInternal = result.href.startsWith("/");
              return isInternal ? (
                <Link
                  key={`${result.kind}-${result.id}`}
                  href={result.href as Route}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line/60 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-paper/70 active:bg-paper/90"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-accent">
                    {result.kind} / {result.meta}
                  </div>
                  <div className="mt-1 font-accent text-xl break-words text-ink">{result.title}</div>
                </Link>
              ) : (
                <a
                  key={`${result.kind}-${result.id}`}
                  href={result.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block border-b border-line/60 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-paper/70 active:bg-paper/90"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-accent">
                    {result.kind} / {result.meta} ↗
                  </div>
                  <div className="mt-1 font-accent text-xl break-words text-ink">{result.title}</div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
