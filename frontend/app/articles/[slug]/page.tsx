import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@/lib/api";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug).catch(() => null);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Article / {article.reading_time} min read</div>
        <h1 className="mt-4 max-w-4xl font-accent text-5xl leading-none md:text-7xl">{article.title}</h1>
        <p className="mt-5 font-sans text-muted">
          By{" "}
          <Link href={`/profile/${article.author.username}`} className="border-b border-line font-bold text-accent transition-colors hover:border-accent hover:bg-clay">
            {article.author.name}
          </Link>
        </p>
      </div>
      <article className="mt-10 max-w-3xl whitespace-pre-wrap border-y border-line py-8 font-sans text-lg leading-8 text-ink">
        {article.content}
      </article>
    </main>
  );
}
