"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { MessageSquarePlus, Search, CheckCircle, ChevronDown } from "lucide-react";
import type { QuestionRead, QuestionStatus } from "@/types/api";
import { listQuestions } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";

const TOPICS = [
  "",
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

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "upvotes", label: "Most Voted" },
  { value: "unanswered", label: "Unanswered" },
] as const;

const STATUS_BADGE: Record<QuestionStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-moss/20 text-moss border-moss/30" },
  answered: { label: "Answered", cls: "bg-clay/20 text-clay border-clay/30" },
  closed: { label: "Closed", cls: "bg-line/20 text-muted border-line/30" },
};

function QuestionCard({ q }: { q: QuestionRead }) {
  const badge = STATUS_BADGE[q.status] || STATUS_BADGE.open;
  return (
    <Link
      href={`/ask/${q.id}` as Route}
      className="group block border border-line bg-paper p-5 transition-all hover:border-accent hover:shadow-[4px_4px_0_var(--color-clay)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center border px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${badge.cls}`}
            >
              {badge.label}
            </span>
            {q.topic_tag && q.topic_tag !== "general" && (
              <span className="border border-line bg-accent/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted">
                {q.topic_tag}
              </span>
            )}
            {q.has_verified_answer && (
              <span className="inline-flex items-center gap-1 border border-clay/40 bg-clay/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-clay">
                <CheckCircle className="h-2.5 w-2.5" />
                Verified Answer
              </span>
            )}
            {q.is_pinned_admin && (
              <span className="border border-line px-2 py-0.5 font-mono text-[10px] text-muted">📌 Pinned</span>
            )}
          </div>
          <h2 className="font-accent text-lg leading-tight text-ink transition-colors group-hover:text-accent">
            {q.title}
          </h2>
          {q.body && (
            <p className="mt-1.5 line-clamp-2 font-sans text-sm text-muted">{q.body}</p>
          )}
          <div className="mt-3 flex items-center gap-3 font-sans text-xs text-muted">
            <span>
              by <span className="font-bold text-ink">{q.author.name}</span>
            </span>
            {q.author.is_verified && (
              <span className="inline-flex items-center gap-1 border border-clay/30 bg-clay/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-clay">
                <CheckCircle className="h-2.5 w-2.5" /> Verified
              </span>
            )}
            <span>·</span>
            <span>
              {new Date(q.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <span className="font-sans text-xs text-muted">
            <span className="font-bold text-ink">{q.answers_count}</span>{" "}
            {q.answers_count === 1 ? "answer" : "answers"}
          </span>
          <span className="font-sans text-xs text-muted">
            <span className="font-bold text-ink">{q.upvotes}</span> votes
          </span>
        </div>
      </div>
    </Link>
  );
}

export function QAIndex({
  initialQuestions,
  totalCount,
}: {
  initialQuestions: QuestionRead[];
  totalCount: number;
}) {
  const [questions, setQuestions] = useState<QuestionRead[]>(initialQuestions);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "upvotes" | "unanswered">("recent");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem(tokenKey)));
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listQuestions({
          limit: 50,
          q: query.trim() || undefined,
          topic: topic || undefined,
          sort,
        });
        setQuestions(res.items);
      } catch {
        /* keep old */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, topic, sort]);

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full border border-line bg-paper pl-10 pr-4 py-3 font-sans text-sm transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
            />
          </div>
          {/* Topic filter */}
          <div className="relative shrink-0">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="appearance-none border border-line bg-paper px-4 py-3 pr-8 font-sans text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="">All topics</option>
              {TOPICS.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          </div>
        </div>

        {isLoggedIn && (
          <Link
            href={"/ask/new" as Route}
            className="inline-flex shrink-0 items-center gap-2 border border-clay bg-clay px-4 py-3 font-sans text-sm font-bold uppercase tracking-wider text-accent transition-all hover:bg-clay/80"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Ask a Question
          </Link>
        )}
      </div>

      {/* Sort pills */}
      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            className={`border px-3 py-1.5 font-sans text-xs uppercase tracking-wider transition-all ${
              sort === opt.value
                ? "border-accent bg-accent text-paper"
                : "border-line text-muted hover:border-accent hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {loading && (
          <span className="ml-2 font-sans text-xs text-muted animate-pulse">Updating...</span>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="border border-line bg-paper px-6 py-12 text-center">
            <p className="font-sans text-sm text-muted">No questions found.</p>
            {isLoggedIn && (
              <Link
                href={"/ask/new" as Route}
                className="mt-4 inline-block border border-clay px-4 py-2 font-sans text-sm font-bold text-clay hover:bg-clay hover:text-accent"
              >
                Ask the first question
              </Link>
            )}
          </div>
        ) : (
          questions.map((q) => <QuestionCard key={q.id} q={q} />)
        )}
      </div>

      {!query && !topic && (
        <p className="font-sans text-xs text-muted">
          Showing {questions.length} of {totalCount} questions
        </p>
      )}
    </div>
  );
}
