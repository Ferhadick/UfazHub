import Link from "next/link";
import { listCollections } from "@/lib/api";
import { CollectionIndex } from "@/components/features/collection-index";

export default async function CollectionsPage() {
  const collections = await listCollections(50).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Collections</h1>
          <p className="mt-2 text-sm text-muted">Curated groups of useful resources.</p>
        </div>
        <Link href="/collections/new" className="w-fit rounded-md border border-line bg-paper px-4 py-2.5 text-sm font-medium hover:bg-paper-50">Create collection</Link>
      </div>
      <CollectionIndex initialCollections={collections.items} />
    </main>
  );
}
