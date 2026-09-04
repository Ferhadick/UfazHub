"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { CheckCircle, ExternalLink, Lock, Pin, ShieldCheck, ThumbsUp } from "lucide-react";
import type { AnswerRead, QuestionDetail } from "@/types/api";
import { ApiClientError, createAnswer, pinAnswer, voteAnswer, voteQuestion } from "@/lib/api";
import { getStoredUser, tokenKey } from "@/lib/auth-storage";
import { MarkdownContent } from "@/components/features/markdown-content";
import { MarkdownEditor } from "@/components/features/markdown-editor";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed) || /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function QuestionThread({ initialQuestion }: { initialQuestion: QuestionDetail }) {
  const [question, setQuestion] = useState<QuestionDetail>(initialQuestion);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [token, setToken] = useState<string | null>(null);
  const [answerBody, setAnswerBody] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [votingQ, setVotingQ] = useState(false);
  const [votingA, setVotingA] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setToken(window.localStorage.getItem(tokenKey));
    setCurrentUser(getStoredUser());
  }, []);

  const isAuthor = currentUser?.id === question.author.id;
  const canAnswer = Boolean(
    currentUser && (currentUser.role === "admin" || currentUser.role === "verified_ufazian" || currentUser.is_verified)
  );
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  async function handleVoteQuestion() {
    if (!token) {
      setVoteMessage("Sign in to vote.");
      return;
    }
    if (votingQ) return;
    setVotingQ(true);
    setVoteMessage(null);
    try {
      setQuestion(await voteQuestion(token, question.id, 1));
    } catch (err) {
      setVoteMessage(err instanceof ApiClientError ? err.message : "Could not record your vote.");
    } finally {
      setVotingQ(false);
    }
  }

  async function handleVoteAnswer(answerId: string) {
    if (!token) {
      setVoteMessage("Sign in to vote.");
      return;
    }
    if (votingA[answerId]) return;
    setVotingA((prev) => ({ ...prev, [answerId]: true }));
    setVoteMessage(null);
    try {
      setQuestion(await voteAnswer(token, answerId, 1));
    } catch (err) {
      setVoteMessage(err instanceof ApiClientError ? err.message : "Could not record your vote.");
    } finally {
      setVotingA((prev) => ({ ...prev, [answerId]: false }));
    }
  }

  async function handleTogglePin(answerId: string) {
    if (!token) return;
    try {
      setQuestion(await pinAnswer(token, question.id, answerId));
    } catch (err) {
      setVoteMessage(err instanceof ApiClientError ? err.message : "Could not update the helpful answer.");
    }
  }

  async function handlePostAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const normalizedResourceUrl = normalizeUrl(resourceUrl);
    if (normalizedResourceUrl && !/^https?:\/\//i.test(normalizedResourceUrl)) {
      setSubmitError("That resource link does not look valid.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const linked_resources = normalizedResourceUrl
      ? [{ title: resourceTitle.trim() || normalizedResourceUrl, url: normalizedResourceUrl }]
      : [];

    try {
      const updated = await createAnswer(token, question.id, { body: answerBody.trim(), linked_resources });
      setQuestion(updated);
      setAnswerBody("");
      setResourceTitle("");
      setResourceUrl("");
      setSubmitSuccess(true);
      window.setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Could not post your answer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <Link href={"/ask" as Route} className="inline-flex text-sm font-medium text-muted hover:text-accent">← All questions</Link>

      <article className="space-y-6 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <span className={`rounded px-2 py-1 text-xs font-semibold ${question.status === "answered" ? "bg-clay text-accent" : question.status === "closed" ? "bg-surface" : "bg-green-50 text-green-800"}`}>
            {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
          </span>
          {question.topic_tag ? <span>{question.topic_tag.replace("-", " ")}</span> : null}
          {question.is_pinned_admin ? <span>Admin pinned</span> : null}
          <span>·</span>
          <span>{dateLabel(question.created_at)}</span>
        </div>

        <h1 className="max-w-4xl font-accent text-3xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
          {question.title}
        </h1>

        {question.body ? <MarkdownContent content={question.body} className="max-w-3xl text-base" /> : null}

        {question.linked_resource ? (
          <div className="max-w-3xl rounded-md border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-muted">Referenced resource</div>
            <div className="mt-1 flex items-start justify-between gap-4">
              <div>
                <Link href={`/resources/${question.linked_resource.id}` as Route} className="font-semibold text-ink hover:text-accent">
                  {question.linked_resource.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{question.linked_resource.description}</p>
              </div>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted" />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <Link href={`/profile/${question.author.username}` as Route} className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {question.author.name.charAt(0).toUpperCase()}
            </span>
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:text-accent">
                {question.author.name}
                {question.author.is_verified ? <CheckCircle className="h-3.5 w-3.5 text-accent" aria-label="Verified" /> : null}
              </span>
              <span className="block text-xs text-muted">@{question.author.username}</span>
            </span>
          </Link>

          <button type="button" onClick={handleVoteQuestion} disabled={votingQ} className="inline-flex items-center gap-2 rounded border border-line bg-paper px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50">
            <ThumbsUp className="h-4 w-4" /> Helpful {question.upvotes > 0 ? `· ${question.upvotes}` : ""}
          </button>
        </div>
        {voteMessage ? <p className="text-sm text-muted">{voteMessage}</p> : null}
      </article>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <h2 className="font-accent text-2xl font-semibold text-ink">{question.answers_count} {question.answers_count === 1 ? "answer" : "answers"}</h2>
          {question.has_verified_answer ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"><ShieldCheck className="h-4 w-4 text-accent" /> Includes a verified answer</span>
          ) : null}
        </div>

        {sortedAnswers.length === 0 ? (
          <div className="rounded-md bg-surface p-6 text-sm leading-6 text-muted">No answers yet.</div>
        ) : (
          <div className="space-y-5">
            {sortedAnswers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                isQuestionAuthor={Boolean(isAuthor)}
                onVote={() => handleVoteAnswer(answer.id)}
                onTogglePin={() => handleTogglePin(answer.id)}
                voting={Boolean(votingA[answer.id])}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-line bg-paper p-5 sm:p-7">
        <h3 className="font-accent text-2xl font-semibold text-ink">Add an answer</h3>
        <p className="mt-1 text-sm leading-6 text-muted">Answers support the same Markdown formatting as notes and questions.</p>

        {canAnswer ? (
          <form onSubmit={handlePostAnswer} className="mt-5 space-y-5">
            {submitError ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</div> : null}
            {submitSuccess ? <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Answer published.</div> : null}

            <MarkdownEditor
              value={answerBody}
              onChange={setAnswerBody}
              minHeightClass="min-h-[180px]"
              placeholder={"Share practical experience, steps, code, or useful context.\n\n## What worked for me\n- First step\n- Second step"}
            />

            <div>
              <div className="mb-2 text-sm font-semibold text-ink">Related link <span className="font-normal text-muted">optional</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="text" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="Link title" className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/15" />
                <input type="text" inputMode="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="example.com or https://..." className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/15" />
              </div>
            </div>

            <div className="flex justify-end border-t border-line pt-5">
              <button type="submit" disabled={submitting || answerBody.trim().length < 5} className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {submitting ? "Posting..." : "Post answer"}
              </button>
            </div>
          </form>
        ) : currentUser ? (
          <div className="mt-5 rounded-md bg-surface p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Lock className="h-4 w-4 text-accent" /> Verified contributors answer questions</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Verified alumni, senior students, and admins can post answers so advice is tied to known community experience.</p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4 rounded-md bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Sign in to participate</p>
              <p className="mt-1 text-sm text-muted">Verified contributors can answer this question.</p>
            </div>
            <Link href={"/login" as Route} className="rounded bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90">Sign in</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function AnswerCard({ answer, isQuestionAuthor, onVote, onTogglePin, voting }: {
  answer: AnswerRead;
  isQuestionAuthor: boolean;
  onVote: () => void;
  onTogglePin: () => void;
  voting: boolean;
}) {
  const author = answer.author;

  return (
    <article className={`rounded-md border p-5 sm:p-6 ${answer.is_pinned ? "border-accent/40 bg-clay" : "border-line bg-paper"}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {answer.is_pinned ? <span className="inline-flex items-center gap-1 rounded bg-paper px-2 py-1 font-semibold text-accent"><Pin className="h-3 w-3" /> Helpful answer</span> : null}
          {author.is_verified ? <span className="inline-flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-accent" /> Verified UFAZian</span> : null}
        </div>
        {isQuestionAuthor ? (
          <button type="button" onClick={onTogglePin} className="inline-flex items-center gap-1.5 rounded border border-line bg-paper px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent">
            <Pin className="h-3.5 w-3.5" /> {answer.is_pinned ? "Unmark helpful" : "Mark helpful"}
          </button>
        ) : null}
      </div>

      <MarkdownContent content={answer.body} className="text-sm sm:text-base" />

      {answer.linked_resources?.length ? (
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 text-xs font-semibold text-muted">Related links</div>
          <div className="flex flex-wrap gap-2">
            {answer.linked_resources.map((res, i) => (
              <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded border border-line bg-paper px-2.5 py-1.5 text-xs font-medium text-accent hover:border-accent">
                <span>{res.title || res.url}</span><ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <Link href={`/profile/${author.username}` as Route} className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{author.name.charAt(0).toUpperCase()}</span>
          <span>
            <span className="block text-sm font-semibold text-ink group-hover:text-accent">{author.name}</span>
            {(author.current_role || author.company_or_institution || author.graduation_year) ? (
              <span className="block text-xs text-muted">{[author.current_role, author.company_or_institution, author.graduation_year ? `Class of ${author.graduation_year}` : null].filter(Boolean).join(" · ")}</span>
            ) : null}
          </span>
        </Link>

        <button type="button" onClick={onVote} disabled={voting} className="inline-flex items-center gap-1.5 rounded border border-line bg-paper px-2.5 py-1.5 text-xs font-medium hover:border-accent hover:text-accent disabled:opacity-50">
          <ThumbsUp className="h-3.5 w-3.5" /> Helpful {answer.upvotes > 0 ? `· ${answer.upvotes}` : ""}
        </button>
      </div>
    </article>
  );
}
