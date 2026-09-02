"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import { createQuestion, ApiClientError } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";

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
      setError("You must be logged in to ask a question.");
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
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border border-red-400/50 bg-red-500/10 px-4 py-3 font-sans text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Your question <span className="text-clay">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={220}
          placeholder="e.g. How should I prepare for AILAB internship technical screen?"
          className="w-full border border-line bg-paper px-4 py-3 font-sans text-base text-ink transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        <p className="font-sans text-xs text-muted">Write it as a clear, specific question.</p>
      </div>

      <div className="space-y-2">
        <label className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted">
          More context <span className="text-muted/60">(optional)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="Add any relevant background, what you've already tried, or what type of answer would help most..."
          className="w-full resize-none border border-line bg-paper px-4 py-3 font-sans text-sm text-ink transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Topic
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border border-line bg-paper px-4 py-3 font-sans text-sm text-ink focus:border-accent focus:outline-none"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || title.trim().length < 5}
        className="w-full border border-clay bg-clay px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.14em] text-accent transition-all hover:bg-clay/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Question"}
      </button>
    </form>
  );
}
