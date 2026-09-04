import Link from "next/link";
import { listArticles } from "@/lib/api";

export default async function ArticlesPage() {
  const articles = await listArticles(30).catch(() => ({ items: [], total: 0, limit: 30, offset: 0 }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Notes</h1>
          <p className="mt-2 text-sm text-muted">Longer writeups and Markdown notes from students.</p>
        </div>
        <Link href="/submit" className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Write</Link>
      </div>
      <div className="divide-y divide-line rounded-lg border border-line bg-paper">
        {articles.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No notes yet.</div>
        ) : articles.items.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="block p-5 transition-colors hover:bg-paper-50 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{article.reading_time} min read</span>
              <span>·</span>
              <span>{article.upvotes - article.downvotes} points</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{article.excerpt}</p>
            <div className="mt-4 text-xs text-muted">by <span className="font-medium text-ink">{article.author.name}</span></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
