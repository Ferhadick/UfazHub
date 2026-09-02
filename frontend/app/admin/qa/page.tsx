"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  Search,
  GitMerge,
  Pin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { AdminQAQueueResponse, QuestionRead } from "@/types/api";
import {
  adminGetQAQueue,
  adminMergeQuestions,
  adminPinQuestion,
  adminCloseQuestion,
  ApiClientError,
} from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";

export default function AdminQAPage() {
  const [data, setData] = useState<AdminQAQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Merge modal state
  const [mergingQuestion, setMergingQuestion] = useState<QuestionRead | null>(null);
  const [targetQuestionId, setTargetQuestionId] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? window.localStorage.getItem(tokenKey) : null;

  async function loadQueue(q?: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetQAQueue(token, q || undefined);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load QA queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue(filterQuery);
  }, [filterQuery]);

  async function handleTogglePin(questionId: string) {
    if (!token) return;
    try {
      await adminPinQuestion(token, questionId);
      loadQueue(filterQuery);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Failed to toggle pin.");
    }
  }

  async function handleCloseQuestion(questionId: string) {
    if (!token) return;
    if (!confirm("Are you sure you want to close this question?")) return;
    try {
      await adminCloseQuestion(token, questionId);
      loadQueue(filterQuery);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Failed to close question.");
    }
  }

  async function handleExecuteMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !mergingQuestion || !targetQuestionId.trim()) return;
    setMergeLoading(true);
    setMergeError(null);
    try {
      await adminMergeQuestions(token, mergingQuestion.id, targetQuestionId.trim());
      setMergingQuestion(null);
      setTargetQuestionId("");
      loadQueue(filterQuery);
    } catch (err) {
      setMergeError(err instanceof ApiClientError ? err.message : "Merge failed.");
    } finally {
      setMergeLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8">
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-line bg-paper p-5 space-y-1">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">
            Unanswered Questions
          </span>
          <div className="font-accent text-3xl text-clay">
            {data?.total_unanswered ?? "..."}
          </div>
        </div>
        <div className="border border-line bg-paper p-5 space-y-1">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">
            Total In System
          </span>
          <div className="font-accent text-3xl text-ink">
            {data?.total_questions ?? "..."}
          </div>
        </div>
        <div className="border border-line bg-paper p-5 space-y-1">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">
            Active Topic Clusters
          </span>
          <div className="font-accent text-3xl text-ink">
            {data?.clusters.length ?? "..."}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search queue or cluster by keyword (e.g. internship, french, lab)..."
            className="w-full border border-line bg-paper pl-10 pr-4 py-2.5 font-sans text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="border border-red-400/50 bg-red-500/10 p-4 font-sans text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Clustered Queue by Keywords */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Layers className="h-5 w-5 text-clay" />
          <h2 className="font-accent text-xl text-ink">Keyword Clusters (Duplicate Spotting)</h2>
        </div>

        {loading && !data ? (
          <p className="font-sans text-sm text-muted animate-pulse">Loading clusters...</p>
        ) : data?.clusters.length === 0 ? (
          <p className="font-sans text-sm text-muted">No question clusters found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.clusters.map((cluster) => (
              <div key={cluster.keyword} className="border border-line bg-paper p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-clay bg-clay/10 px-2 py-0.5 border border-clay/30">
                      {cluster.keyword}
                    </span>
                    <span className="font-sans text-xs text-muted">
                      ({cluster.count} matching)
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {cluster.questions.map((q) => (
                    <li
                      key={q.id}
                      className="border border-line/40 bg-paper-dark/20 p-3 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <Link
                          href={`/ask/${q.id}` as Route}
                          target="_blank"
                          className="font-sans text-sm font-bold text-ink hover:text-accent line-clamp-1"
                        >
                          {q.title}
                        </Link>
                        <span className="font-sans text-[11px] text-muted">
                          by {q.author.name} · {q.answers_count} answers · {q.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-line/30">
                        <button
                          type="button"
                          onClick={() => setMergingQuestion(q)}
                          className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-clay border border-clay/40 px-2 py-0.5 hover:bg-clay hover:text-accent transition-all"
                        >
                          <GitMerge className="h-2.5 w-2.5" />
                          Merge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(q.id)}
                          className={`inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider border px-2 py-0.5 transition-all ${
                            q.is_pinned_admin
                              ? "border-accent bg-accent text-paper"
                              : "border-line text-muted hover:border-accent hover:text-ink"
                          }`}
                        >
                          <Pin className="h-2.5 w-2.5" />
                          {q.is_pinned_admin ? "Pinned" : "Pin"}
                        </button>
                        {q.status !== "closed" && (
                          <button
                            type="button"
                            onClick={() => handleCloseQuestion(q.id)}
                            className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-red-400 border border-red-400/40 px-2 py-0.5 hover:bg-red-400 hover:text-paper transition-all"
                          >
                            <XCircle className="h-2.5 w-2.5" />
                            Close
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Questions List */}
      <section className="space-y-4 border-t border-line pt-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-accent" />
          <h2 className="font-accent text-xl text-ink">Recent Submissions</h2>
        </div>

        <div className="border border-line overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-paper-dark/40 border-b border-line uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Author</th>
                <th className="p-3">Topic</th>
                <th className="p-3">Status</th>
                <th className="p-3">Answers</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 bg-paper">
              {data?.recent_questions.map((q) => (
                <tr key={q.id} className="hover:bg-paper-dark/20">
                  <td className="p-3 font-bold max-w-xs truncate">
                    <Link href={`/ask/${q.id}` as Route} className="hover:text-accent">
                      {q.title}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{q.author.name}</td>
                  <td className="p-3">{q.topic_tag}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 border text-[10px] uppercase ${
                        q.status === "answered"
                          ? "border-clay/30 bg-clay/10 text-clay"
                          : q.status === "closed"
                          ? "border-line text-muted"
                          : "border-moss/30 bg-moss/10 text-moss"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-3">{q.answers_count}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setMergingQuestion(q)}
                      className="text-clay hover:underline uppercase text-[10px]"
                    >
                      Merge
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(q.id)}
                      className="text-accent hover:underline uppercase text-[10px]"
                    >
                      {q.is_pinned_admin ? "Unpin" : "Pin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Merge Modal */}
      {mergingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-paper p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-accent text-lg text-ink flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-clay" />
                Merge Duplicate Question
              </h3>
              <button
                type="button"
                onClick={() => setMergingQuestion(null)}
                className="text-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
                Source Question (Will be closed and answers transferred):
              </span>
              <p className="font-sans text-sm font-bold text-ink">
                {mergingQuestion.title}
              </p>
            </div>

            <form onSubmit={handleExecuteMerge} className="space-y-4">
              {mergeError && (
                <div className="border border-red-400/50 bg-red-500/10 p-3 font-sans text-xs text-red-400">
                  {mergeError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                  Target Question ID (Master Question)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste UUID of primary question..."
                  value={targetQuestionId}
                  onChange={(e) => setTargetQuestionId(e.target.value)}
                  className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMergingQuestion(null)}
                  className="border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mergeLoading || !targetQuestionId.trim()}
                  className="border border-clay bg-clay px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80 disabled:opacity-50"
                >
                  {mergeLoading ? "Merging..." : "Confirm & Merge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
