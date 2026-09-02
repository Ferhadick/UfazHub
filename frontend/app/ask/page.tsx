import { listQuestions } from "@/lib/api";
import { QAIndex } from "@/components/features/qa-index";

export const metadata = { title: "Q&A — UFAZ Hub" };

export default async function AskPage() {
  const data = await listQuestions({ limit: 50, sort: "recent" }).catch(() => ({
    items: [],
    total: 0,
    limit: 50,
    offset: 0,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Q&amp;A Platform</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-6xl">Ask &amp; Answer</h1>
        <p className="mt-3 font-sans text-sm text-muted">
          Questions answered by verified UFAZ alumni and senior students.
        </p>
      </div>
      <QAIndex initialQuestions={data.items} totalCount={data.total} />
    </main>
  );
}
