"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import { createQuestion, ApiClientError } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";
import { MarkdownEditor } from "@/components/features/markdown-editor";

const TOPICS = [
  "internships",
  "machine-learning",
  "career",
  "exams",
  "master",
  "petroleum",
  "math",
  "software",
  "general",
] as const;

export function AskQuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<string>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setError("Sign in before asking a question.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = await createQuestion(token, {
        title: title.trim(),
        body: body.trim() || undefined,
        topic_tag: topic,
      });
      router.push(`/ask/${q.id}` as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not post your question. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="question-title" className="mb-1.5 block text-sm font-semibold text-ink">
          Question
        </label>
        <input
          id="question-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
          maxLength={220}
          placeholder="How should I prepare for the AILAB internship technical screen?"
          className="w-full rounded-md border border-line bg-paper px-3.5 py-3 text-base text-ink outline-none placeholder:text-muted/65 focus:border-accent focus:ring-1 focus:ring-accent/15"
        />
        <p className="mt-1.5 text-xs leading-5 text-muted">Keep the title specific. Add details below if they help someone answer well.</p>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="question-body" className="text-sm font-semibold text-ink">Context <span className="font-normal text-muted">optional</span></label>
          <span className="text-xs text-muted">Markdown supported</span>
        </div>
        <MarkdownEditor
          id="question-body"
          value={body}
          onChange={setBody}
          minHeightClass="min-h-[210px]"
          placeholder={"Add context, what you tried, code, links, or constraints.\n\n## What I tried\n- First approach\n- Second approach"}
        />
      </div>

      <div className="max-w-sm">
        <label htmlFor="question-topic" className="mb-1.5 block text-sm font-semibold text-ink">Topic</label>
        <select
          id="question-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-md border border-line bg-paper px-3.5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end border-t border-line pt-5">
        <button
          type="submit"
          disabled={loading || title.trim().length < 5}
          className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "Posting..." : "Post question"}
        </button>
      </div>
    </form>
  );
}
