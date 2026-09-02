import { AskQuestionForm } from "@/components/features/ask-question-form";

export const metadata = { title: "Ask a Question — UFAZ Hub" };

export default function NewQuestionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Q&amp;A / Ask</div>
        <h1 className="mt-2 font-accent text-4xl leading-none">Ask a Question</h1>
        <p className="mt-3 font-sans text-sm text-muted">
          Your question will be seen by Verified UFAZians who can answer from real experience.
        </p>
      </div>
      <AskQuestionForm />
    </main>
  );
}
