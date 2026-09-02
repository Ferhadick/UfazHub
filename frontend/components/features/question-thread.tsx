"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  ThumbsUp,
  Pin,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Lock,
} from "lucide-react";
import type { QuestionDetail, AnswerRead } from "@/types/api";
import {
  voteQuestion,
  voteAnswer,
  pinAnswer,
  createAnswer,
  ApiClientError,
} from "@/lib/api";
import { getStoredUser, tokenKey } from "@/lib/auth-storage";

export function QuestionThread({
  initialQuestion,
}: {
  initialQuestion: QuestionDetail;
}) {
  const [question, setQuestion] = useState<QuestionDetail>(initialQuestion);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [token, setToken] = useState<string | null>(null);

  // New answer form state
  const [answerBody, setAnswerBody] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Voting loading states
  const [votingQ, setVotingQ] = useState(false);
  const [votingA, setVotingA] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const t = window.localStorage.getItem(tokenKey);
    setToken(t);
    setCurrentUser(getStoredUser());
  }, []);

  const isAuthor = currentUser?.id === question.author.id;
  const canAnswer =
    currentUser &&
    (currentUser.role === "admin" ||
      currentUser.role === "verified_ufazian" ||
      currentUser.is_verified);

  // Sort answers: pinned first, then upvotes descending
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  async function handleVoteQuestion() {
    if (!token) {
      alert("Please log in to upvote.");
      return;
    }
    if (votingQ) return;
    setVotingQ(true);
    try {
      const updated = await voteQuestion(token, question.id, 1);
      setQuestion(updated);
    } catch {
      // Ignore
    } finally {
      setVotingQ(false);
    }
  }

  async function handleVoteAnswer(answerId: string) {
    if (!token) {
      alert("Please log in to upvote.");
      return;
    }
    if (votingA[answerId]) return;
    setVotingA((prev) => ({ ...prev, [answerId]: true }));
    try {
      const updated = await voteAnswer(token, answerId, 1);
      setQuestion(updated);
    } catch {
      // Ignore
    } finally {
      setVotingA((prev) => ({ ...prev, [answerId]: false }));
    }
  }

  async function handleTogglePin(answerId: string) {
    if (!token) return;
    try {
      const updated = await pinAnswer(token, question.id, answerId);
      setQuestion(updated);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Failed to toggle pin.");
    }
  }

  async function handlePostAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);

    const linked_resources =
      resourceUrl.trim()
        ? [{ title: resourceTitle.trim() || resourceUrl.trim(), url: resourceUrl.trim() }]
        : [];

    try {
      const updated = await createAnswer(token, question.id, {
        body: answerBody.trim(),
        linked_resources,
      });
      setQuestion(updated);
      setAnswerBody("");
      setResourceTitle("");
      setResourceUrl("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Failed to post answer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Back button */}
      <div>
        <Link
          href={"/ask" as Route}
          className="font-sans text-xs uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors"
        >
          ← Back to all questions
        </Link>
      </div>

      {/* Question Main Block */}
      <article className="border border-line bg-paper p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center border px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                question.status === "answered"
                  ? "bg-clay/20 text-clay border-clay/30"
                  : question.status === "closed"
                  ? "bg-line/20 text-muted border-line/30"
                  : "bg-moss/20 text-moss border-moss/30"
              }`}
            >
              {question.status}
            </span>
            {question.topic_tag && (
              <span className="border border-line bg-accent/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted">
                {question.topic_tag}
              </span>
            )}
            {question.is_pinned_admin && (
              <span className="border border-line px-2 py-0.5 font-mono text-[10px] text-muted">
                📌 Pinned by Admin
              </span>
            )}
          </div>
          <span className="font-sans text-xs text-muted">
            {new Date(question.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="font-accent text-2xl md:text-4xl text-ink leading-tight">
          {question.title}
        </h1>

        {question.body && (
          <div className="whitespace-pre-wrap font-sans text-base text-ink leading-relaxed border-t border-line/40 pt-4">
            {question.body}
          </div>
        )}

        {/* Linked Resource Card if attached */}
        {question.linked_resource && (
          <div className="border border-line/60 bg-paper-dark/30 p-4 space-y-1.5">
            <span className="font-sans text-[10px] uppercase tracking-widest text-muted">
              Referenced Hub Resource
            </span>
            <div className="flex items-center justify-between">
              <Link
                href={`/resources/${question.linked_resource.id}` as Route}
                className="font-accent text-base text-ink hover:text-accent font-bold"
              >
                {question.linked_resource.title}
              </Link>
              <ExternalLink className="h-4 w-4 text-muted" />
            </div>
            <p className="font-sans text-xs text-muted line-clamp-2">
              {question.linked_resource.description}
            </p>
          </div>
        )}

        {/* Author info & upvote row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${question.author.username}` as Route}
              className="group flex items-center gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center border border-line bg-accent text-paper font-accent text-xs">
                {question.author.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <span className="block font-sans text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  {question.author.name}
                </span>
                <span className="block font-sans text-[10px] text-muted">
                  @{question.author.username}
                </span>
              </div>
            </Link>
            {question.author.is_verified && (
              <span className="inline-flex items-center gap-1 border border-clay/30 bg-clay/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-clay">
                <CheckCircle className="h-2.5 w-2.5" /> Verified
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleVoteQuestion}
            disabled={votingQ}
            className="inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-ink transition-all hover:border-accent hover:shadow-[2px_2px_0_var(--color-clay)] disabled:opacity-50"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Upvote ({question.upvotes})</span>
          </button>
        </div>
      </article>

      {/* Answers Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-accent text-xl md:text-2xl text-ink">
            {question.answers_count} {question.answers_count === 1 ? "Answer" : "Answers"}
          </h2>
          {question.has_verified_answer && (
            <span className="inline-flex items-center gap-1.5 font-sans text-xs text-clay font-bold">
              <ShieldCheck className="h-4 w-4" />
              Verified Community Answer Included
            </span>
          )}
        </div>

        {sortedAnswers.length === 0 ? (
          <div className="border border-dashed border-line p-8 text-center">
            <p className="font-sans text-sm text-muted">
              No answers yet. Verified UFAZ alumni and seniors will weigh in soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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

      {/* Post Answer Section */}
      <section className="border border-line bg-paper p-6 md:p-8 space-y-4">
        <h3 className="font-accent text-xl text-ink">Contribute an Answer</h3>

        {canAnswer ? (
          <form onSubmit={handlePostAnswer} className="space-y-4">
            {submitError && (
              <div className="border border-red-400/50 bg-red-500/10 px-4 py-3 font-sans text-sm text-red-400">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="border border-moss/50 bg-moss/10 px-4 py-3 font-sans text-sm text-moss">
                Your answer has been published. Thank you for giving back to the community!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                Your verified answer <span className="text-clay">*</span>
              </label>
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                required
                rows={6}
                placeholder="Share your practical experience, insights, coursework advice, or interview tips..."
                className="w-full resize-none border border-line bg-paper px-4 py-3 font-sans text-sm text-ink transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
              />
            </div>

            {/* Optional linked resource */}
            <div className="space-y-2 border-t border-line/40 pt-3">
              <span className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                Link a Resource or Guide <span className="text-muted/60">(optional)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Resource title (e.g. Official Course Syllabus)"
                  className="border border-line bg-paper px-3 py-2 font-sans text-xs text-ink focus:border-accent focus:outline-none"
                />
                <input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="border border-line bg-paper px-3 py-2 font-sans text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || answerBody.trim().length < 5}
                className="inline-flex items-center gap-2 border border-clay bg-clay px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-accent transition-all hover:bg-clay/80 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Posting..." : "Post Verified Answer"}
              </button>
            </div>
          </form>
        ) : currentUser ? (
          <div className="border border-line/70 bg-accent/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-ink font-sans text-sm font-bold">
              <Lock className="h-4 w-4 text-clay" />
              <span>Verified Answers Only</span>
            </div>
            <p className="font-sans text-xs text-muted leading-relaxed">
              To ensure questions are answered with verified authenticity and firsthand experience,
              only Verified UFAZians (alumni and senior students) can post answers.
              If you are an alumnus or senior student, please contact an admin or complete your profile to request verification.
            </p>
          </div>
        ) : (
          <div className="border border-line/70 bg-accent/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-sans text-sm font-bold text-ink">Sign in to participate</p>
              <p className="font-sans text-xs text-muted">
                Are you an alumnus or verified member? Log in to answer this question.
              </p>
            </div>
            <Link
              href={"/login" as Route}
              className="shrink-0 border border-clay bg-clay px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function AnswerCard({
  answer,
  isQuestionAuthor,
  onVote,
  onTogglePin,
  voting,
}: {
  answer: AnswerRead;
  isQuestionAuthor: boolean;
  onVote: () => void;
  onTogglePin: () => void;
  voting: boolean;
}) {
  const author = answer.author;

  return (
    <article
      className={`border p-6 space-y-4 transition-all ${
        answer.is_pinned
          ? "border-clay bg-clay/5 shadow-[4px_4px_0_var(--color-clay)]"
          : "border-line bg-paper"
      }`}
    >
      {/* Top badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {answer.is_pinned && (
            <span className="inline-flex items-center gap-1 border border-clay bg-clay px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-accent">
              <Pin className="h-2.5 w-2.5" />
              Pinned Answer
            </span>
          )}
          {author.is_verified && (
            <span className="inline-flex items-center gap-1 border border-clay/40 bg-clay/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-clay">
              <CheckCircle className="h-2.5 w-2.5" />
              Verified UFAZian
            </span>
          )}
        </div>

        {isQuestionAuthor && (
          <button
            type="button"
            onClick={onTogglePin}
            className="inline-flex items-center gap-1 border border-line px-2 py-1 font-sans text-[10px] uppercase tracking-wider text-muted hover:border-clay hover:text-clay transition-all"
            title="Pin or unpin this answer"
          >
            <Pin className="h-3 w-3" />
            <span>{answer.is_pinned ? "Unpin" : "Pin as helpful"}</span>
          </button>
        )}
      </div>

      {/* Answer Body */}
      <div className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">
        {answer.body}
      </div>

      {/* Linked Resources */}
      {answer.linked_resources && answer.linked_resources.length > 0 && (
        <div className="space-y-1.5 border-t border-line/40 pt-3">
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
            Recommended Links:
          </span>
          <div className="flex flex-wrap gap-2">
            {answer.linked_resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border border-line bg-paper px-2 py-1 font-sans text-xs text-accent hover:border-accent"
              >
                <span>{res.title || res.url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Author bio & voting */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${author.username}` as Route} className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center border border-line bg-accent text-paper font-accent text-xs">
              {author.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  {author.name}
                </span>
              </div>
              {(author.current_role || author.company_or_institution || author.graduation_year) && (
                <span className="block font-sans text-[11px] text-muted">
                  {[
                    author.current_role,
                    author.company_or_institution,
                    author.graduation_year ? `Class of '${String(author.graduation_year).slice(-2)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={onVote}
          disabled={voting}
          className="inline-flex items-center gap-1.5 border border-line bg-paper px-2.5 py-1 font-sans text-xs uppercase tracking-wider text-ink hover:border-accent transition-all disabled:opacity-50"
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{answer.upvotes}</span>
        </button>
      </div>
    </article>
  );
}
