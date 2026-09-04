import { listQuestions } from "@/lib/api";
import { QAIndex } from "@/components/features/qa-index";

export const metadata = { title: "Q&A — UFAZ Hub" };

export default async function AskPage() {
  const data = await listQuestions({ limit: 50, sort: "recent" }).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Questions & answers</h1>
        <p className="mt-2 text-sm text-muted">Ask the UFAZ community and learn from previous answers.</p>
      </div>
      <QAIndex initialQuestions={data.items} totalCount={data.total} />
    </main>
  );
}
