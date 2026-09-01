import { ArticleForm } from "@/components/features/article-form";

export default function NewArticlePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Submit / Article</div>
        <h1 className="mt-2 font-accent text-5xl">Write a field note.</h1>
      </div>
      <ArticleForm />
    </main>
  );
}

