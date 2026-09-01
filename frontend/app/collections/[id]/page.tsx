import { notFound } from "next/navigation";
import { getCollection } from "@/lib/api";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getCollection(id).catch(() => null);
  if (!collection) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Collection / {collection.items.length} resources</div>
        <h1 className="mt-4 font-accent text-6xl leading-tight">{collection.title}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-muted">{collection.description}</p>
      </div>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {collection.items.map((item) => (
          <a key={item.resource.id} href={item.resource.url} className="grid gap-4 py-5 md:grid-cols-[4rem_1fr]">
            <div className="font-accent text-2xl text-muted">{String(item.position).padStart(2, "0")}</div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">{item.resource.type}</div>
              <h2 className="mt-1 font-accent text-3xl">{item.resource.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.resource.description}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

