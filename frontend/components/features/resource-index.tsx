"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { ResourceRead, ResourceType } from "@/types/api";
import { listResources } from "@/lib/api";
import { ResourceList } from "@/components/features/resource-list";

const RESOURCE_TYPES: { label: string; value: ResourceType | "" }[] = [
  { label: "All types", value: "" },
  { label: "Course", value: "course" },
  { label: "Article", value: "article" },
  { label: "Video", value: "video" },
  { label: "Document", value: "docs" },
  { label: "GitHub repository", value: "github_repo" },
  { label: "Website", value: "website" },
  { label: "Book", value: "book" }
];

export function ResourceIndex({
  initialResources,
  initialQuery = "",
  initialType = "",
}: {
  initialResources: ResourceRead[];
  initialQuery?: string;
  initialType?: ResourceType | "";
}) {
  const [resources, setResources] = useState<ResourceRead[]>(initialResources);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<ResourceType | "">(initialType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listResources(50, query.trim() || undefined, type || undefined);
        setResources(res.items);
      } catch {
        // Keep the last successful results visible.
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, type]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, tag, author or topic"
              className="w-full rounded-md border border-line bg-paper py-3 pl-10 pr-24 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
            />
            {loading ? <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">Updating...</span> : null}
          </div>
          <div className="relative shrink-0">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ResourceType | "")}
              className="appearance-none rounded-md border border-line bg-paper px-4 py-3 pr-9 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
            >
              {RESOURCE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </div>

      {(query || type) ? (
        <div className="text-xs text-muted">
          {resources.length} result{resources.length !== 1 ? "s" : ""}{query ? ` for “${query}”` : ""}{type ? ` · ${RESOURCE_TYPES.find((item) => item.value === type)?.label}` : ""}
        </div>
      ) : null}

      <ResourceList resources={resources} />
    </div>
  );
}
