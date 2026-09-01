import Link from "next/link";
import { listCollections } from "@/lib/api";

export default async function CollectionsPage() {
  const collections = await listCollections(30).catch(() => ({ items: [], total: 0, limit: 30, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10 flex items-end justify-between border-t border-line pt-5">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted">02 / Collections</div>
          <h1 className="mt-2 font-accent text-6xl">Follow a thread</h1>
        </div>
        <Link href="/collections/new" className="border border-line px-3 py-2 text-sm">Create</Link>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {collections.items.map((collection, index) => (
          <Link key={collection.id} href={`/collections/${collection.id}`} className="grid gap-4 py-6 md:grid-cols-[4rem_1fr_8rem]">
            <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">Collection / {collection.items.length} resources</div>
              <h2 className="mt-2 font-accent text-3xl">{collection.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{collection.description}</p>
            </div>
            <div className="text-right font-accent text-2xl">{collection.upvotes - collection.downvotes}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
