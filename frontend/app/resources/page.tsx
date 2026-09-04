import Link from "next/link";
import { listResources } from "@/lib/api";
import { ResourceIndex } from "@/components/features/resource-index";
import type { ResourceType } from "@/types/api";

export const metadata = { title: "Resources — UFAZ Hub" };

const VALID_TYPES = new Set<ResourceType>(["course", "article", "video", "docs", "github_repo", "website", "book"]);

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const resourceType = params.type && VALID_TYPES.has(params.type as ResourceType) ? params.type as ResourceType : "";
  const resources = await listResources(50, query || undefined, resourceType || undefined).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-accent">Community library</p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Resources</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Browse files, links, documentation, courses and repositories shared by the UFAZ community.</p>
        </div>
        <Link href="/submit" className="w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Share something</Link>
      </div>
      <ResourceIndex initialResources={resources.items} initialQuery={query} initialType={resourceType} />
    </main>
  );
}
