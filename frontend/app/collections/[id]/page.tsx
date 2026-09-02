import { notFound } from "next/navigation";
import { getCollection } from "@/lib/api";
import { CollectionDetailClient } from "@/components/features/collection-detail-client";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getCollection(id).catch(() => null);
  if (!collection) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <CollectionDetailClient collection={collection} />
    </main>
  );
}

