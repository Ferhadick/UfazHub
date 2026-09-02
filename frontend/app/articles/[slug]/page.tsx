import { notFound } from "next/navigation";
import { getArticle } from "@/lib/api";
import { ArticleDetailClient } from "@/components/features/article-detail-client";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug).catch(() => null);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
      <ArticleDetailClient article={article} />
    </main>
  );
}
