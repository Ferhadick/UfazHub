import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@/lib/api";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug).catch(() => null);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Article / {article.reading_time} min read</div>
        <h1 className="mt-4 max-w-4xl font-accent text-3xl leading-tight break-words sm:text-5xl md:text-7xl">{article.title}</h1>
        <p className="mt-5 font-sans text-sm text-muted sm:text-base">
          By{" "}
          <Link href={`/profile/${article.author.username}`} className="border-b border-line font-bold text-accent transition-colors hover:border-accent hover:bg-clay">
            {article.author.name}
          </Link>
        </p>
      </div>
      <article className="mt-8 max-w-3xl whitespace-pre-wrap break-words border-y border-line py-6 font-sans text-base leading-relaxed text-ink sm:mt-10 sm:py-8 sm:text-lg sm:leading-8">
        {article.content}
      </article>
    </main>
  );
}
