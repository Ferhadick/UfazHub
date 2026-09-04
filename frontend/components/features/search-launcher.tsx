"use client";

import { Search } from "lucide-react";

export function SearchLauncher() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
      className="mt-7 flex w-full max-w-2xl items-center gap-3 rounded border border-line bg-paper px-4 py-3.5 text-left text-sm text-muted transition-colors hover:border-accent"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1">Search notes, links, collections and questions</span>
      <kbd className="hidden border-l border-line pl-3 text-[11px] text-muted sm:inline">⌘K</kbd>
    </button>
  );
}
