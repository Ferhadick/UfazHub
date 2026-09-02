import Link from "next/link";
import { listCollections } from "@/lib/api";
import { CollectionIndex } from "@/components/features/collection-index";

export default async function CollectionsPage() {
  const collections = await listCollections(50).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted">02 / Collections</div>
          <h1 className="mt-2 font-accent text-4xl leading-none md:text-6xl">Follow a thread</h1>
          <p className="mt-3 font-sans text-sm text-muted">
            Curated sequences of resources with a clear starting point.
          </p>
        </div>
        <Link href="/collections/new" className="w-fit border border-line px-3 py-2 text-sm font-sans hover:border-accent hover:bg-clay transition-colors">Create</Link>
      </div>
      <CollectionIndex initialCollections={collections.items} />
    </main>
  );
}
