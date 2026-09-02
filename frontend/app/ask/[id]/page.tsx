import { getQuestion } from "@/lib/api";
import { QuestionThread } from "@/components/features/question-thread";
import { notFound } from "next/navigation";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await getQuestion(id).catch(() => null);
  if (!question) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <QuestionThread initialQuestion={question} />
    </main>
  );
}
