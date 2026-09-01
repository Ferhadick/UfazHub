import Link from "next/link";
import { listArticles } from "@/lib/api";

export default async function ArticlesPage() {
  const articles = await listArticles(30).catch(() => ({ items: [], total: 0, limit: 30, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10 flex items-end justify-between border-t border-line pt-5">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Articles</div>
          <h1 className="mt-2 font-accent text-6xl">Field notes</h1>
        </div>
        <Link href="/articles/new" className="border border-line px-3 py-2 text-sm">Write</Link>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {articles.items.map((article, index) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="grid gap-4 py-6 md:grid-cols-[4rem_1fr_8rem]">
            <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">Article / {article.reading_time} min read</div>
              <h2 className="mt-2 font-accent text-3xl">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{article.excerpt}</p>
            </div>
            <div className="text-right font-accent text-2xl">{article.upvotes - article.downvotes}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

