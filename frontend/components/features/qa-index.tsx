"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, MessageSquarePlus, Search } from "lucide-react";
import type { QuestionRead, QuestionStatus } from "@/types/api";
import { listQuestions } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";

const TOPICS = ["", "internships", "machine-learning", "career", "exams", "master", "petroleum", "math", "software", "general"] as const;
const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "upvotes", label: "Most helpful" },
  { value: "unanswered", label: "Unanswered" },
] as const;

const STATUS_BADGE: Record<QuestionStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-green-50 text-green-800" },
  answered: { label: "Answered", cls: "bg-clay text-accent" },
  closed: { label: "Closed", cls: "bg-surface text-muted" },
};

function QuestionCard({ q }: { q: QuestionRead }) {
  const badge = STATUS_BADGE[q.status] || STATUS_BADGE.open;
  return (
    <Link href={`/ask/${q.id}` as Route} className="group block border-b border-line py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className={`rounded px-2 py-1 font-semibold ${badge.cls}`}>{badge.label}</span>
            {q.topic_tag && q.topic_tag !== "general" ? <span>{q.topic_tag.replace("-", " ")}</span> : null}
            {q.has_verified_answer ? <span className="inline-flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-accent" /> Verified answer</span> : null}
            {q.is_pinned_admin ? <span>Admin pinned</span> : null}
          </div>
          <h2 className="font-accent text-xl font-semibold leading-snug text-ink group-hover:text-accent sm:text-2xl">{q.title}</h2>
          {q.body ? <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-muted">{q.body.replace(/[#*_>`\[\]]/g, "")}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Asked by <span className="font-semibold text-ink">{q.author.name}</span></span>
            {q.author.is_verified ? <CheckCircle className="h-3.5 w-3.5 text-accent" aria-label="Verified" /> : null}
            <span>·</span>
            <span>{new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-xs leading-6 text-muted sm:block">
          <div><span className="font-semibold text-ink">{q.answers_count}</span> {q.answers_count === 1 ? "answer" : "answers"}</div>
          <div><span className="font-semibold text-ink">{q.upvotes}</span> helpful</div>
        </div>
      </div>
    </Link>
  );
}

export function QAIndex({ initialQuestions, totalCount }: { initialQuestions: QuestionRead[]; totalCount: number }) {
  const [questions, setQuestions] = useState<QuestionRead[]>(initialQuestions);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "upvotes" | "unanswered">("recent");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => setIsLoggedIn(Boolean(window.localStorage.getItem(tokenKey))), []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listQuestions({ limit: 50, q: query.trim() || undefined, topic: topic || undefined, sort });
        setQuestions(res.items);
      } catch {
        // Keep the last successful list if the API is temporarily unavailable.
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, topic, sort]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" className="w-full rounded-md border border-line bg-paper py-3 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/15" />
        </div>
        <div className="relative min-w-44">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full appearance-none rounded-md border border-line bg-paper px-3.5 py-3 pr-9 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/15">
            <option value="">All topics</option>
            {TOPICS.filter(Boolean).map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        {isLoggedIn ? (
          <Link href={"/ask/new" as Route} className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
            <MessageSquarePlus className="h-4 w-4" /> Ask a question
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3">
        {SORT_OPTIONS.map((option) => (
          <button key={option.value} type="button" onClick={() => setSort(option.value)} className={`border-b-2 pb-2 text-sm font-medium ${sort === option.value ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}>
            {option.label}
          </button>
        ))}
        {loading ? <span className="ml-auto text-xs text-muted">Updating...</span> : null}
      </div>

      {questions.length === 0 ? (
        <div className="rounded-md bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No questions match this view.</p>
          {isLoggedIn ? <Link href={"/ask/new" as Route} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">Ask the first question</Link> : null}
        </div>
      ) : (
        <div>{questions.map((q) => <QuestionCard key={q.id} q={q} />)}</div>
      )}

      {!query && !topic ? <p className="text-xs text-muted">Showing {questions.length} of {totalCount} questions</p> : null}
    </div>
  );
}
