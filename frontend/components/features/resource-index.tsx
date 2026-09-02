"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { ResourceRead, ResourceType } from "@/types/api";
import { listResources } from "@/lib/api";
import { ResourceList } from "@/components/features/resource-list";

const RESOURCE_TYPES: { label: string; value: ResourceType | "" }[] = [
  { label: "All types", value: "" },
  { label: "Course", value: "course" },
  { label: "Article", value: "article" },
  { label: "Video", value: "video" },
  { label: "Documentation", value: "docs" },
  { label: "GitHub Repo", value: "github_repo" },
  { label: "Website", value: "website" },
  { label: "Book", value: "book" }
];

export function ResourceIndex({ initialResources }: { initialResources: ResourceRead[] }) {
  const [resources, setResources] = useState<ResourceRead[]>(initialResources);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listResources(50, query.trim() || undefined, type || undefined);
        setResources(res.items);
      } catch {
        // keep old list on error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, type]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, tag, or author..."
            className="w-full border border-line bg-paper pl-10 pr-4 py-3 font-body text-sm transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
          />
          {loading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted font-sans animate-pulse">
              Searching...
            </span>
          )}
        </div>
        <div className="relative shrink-0">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType | "")}
            className="appearance-none border border-line bg-paper px-4 py-3 pr-8 font-body text-sm text-ink transition-all focus:border-accent focus:outline-none"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Results summary */}
      {(query || type) && (
        <div className="font-sans text-xs text-muted">
          {resources.length} result{resources.length !== 1 ? "s" : ""}
          {query ? ` for "${query}"` : ""}
          {type ? ` · filtered by ${RESOURCE_TYPES.find((t) => t.value === type)?.label}` : ""}
        </div>
      )}

      <ResourceList resources={resources} />
    </div>
  );
}
