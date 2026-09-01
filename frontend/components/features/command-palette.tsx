"use client";

import { Search, X } from "lucide-react";
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
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 px-4 pt-24" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-2xl border border-line bg-paper shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the archive"
            className="w-full bg-transparent outline-none"
          />
          <Button variant="quiet" onClick={() => setOpen(false)} aria-label="Close search">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-96 overflow-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-sm text-muted">Search resources, notes, tools, and course material.</div>
          ) : (
            results.map((result) => (
              <a key={`${result.kind}-${result.id}`} href={result.href} className="block border-b border-line px-3 py-3 last:border-b-0">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">{result.kind} / {result.meta}</div>
                <div className="mt-1 font-accent text-xl">{result.title}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
