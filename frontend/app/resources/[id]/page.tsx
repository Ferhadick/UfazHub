import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getResource } from "@/lib/api";
import { ResourceDetailClient } from "@/components/features/resource-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const resource = await getResource(id);
    return {
      title: `${resource.title} · UFAZ Hub`,
      description: resource.description.slice(0, 160)
    };
  } catch {
    return {
      title: "Resource · UFAZ Hub"
    };
  }
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let resource;
  try {
    resource = await getResource(id);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <ResourceDetailClient resource={resource} />
    </main>
  );
}
