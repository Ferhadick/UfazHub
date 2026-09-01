import { ResourceList } from "@/components/features/resource-list";
import { listResources } from "@/lib/api";

export default async function ResourcesPage() {
  const resources = await listResources(30).catch(() => ({ items: [], total: 0, limit: 30, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">01 / Explore</div>
        <h1 className="mt-2 font-accent text-6xl">The index</h1>
      </div>
      <ResourceList resources={resources.items} />
    </main>
  );
}

