import { listResources } from "@/lib/api";
import { ResourceIndex } from "@/components/features/resource-index";

export default async function ResourcesPage() {
  const resources = await listResources(50).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">01 / Explore</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-6xl">The index</h1>
        <p className="mt-3 font-sans text-sm text-muted">
          {resources.total} resource{resources.total !== 1 ? "s" : ""} curated by UFAZ students.
        </p>
      </div>
      <ResourceIndex initialResources={resources.items} />
    </main>
  );
}


