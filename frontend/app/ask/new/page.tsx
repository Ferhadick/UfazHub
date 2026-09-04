import { AskQuestionForm } from "@/components/features/ask-question-form";

export const metadata = { title: "Ask a question — UFAZ Hub" };

export default function NewQuestionPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-9 md:px-8 md:py-12">
      <div className="mb-8 max-w-3xl border-b border-line pb-6">
        <p className="mb-2 text-sm font-semibold text-accent">UFAZ Q&amp;A</p>
        <h1 className="font-accent text-4xl font-semibold tracking-tight md:text-5xl">Ask a clear question.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Add enough context for alumni, senior students, and other verified contributors to give you a useful answer.
        </p>
      </div>
      <AskQuestionForm />
    </main>
  );
}
