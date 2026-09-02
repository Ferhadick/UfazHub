"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Eye,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  BookOpen,
} from "lucide-react";
import type { Difficulty, ResourceType } from "@/types/api";
import { createResource, ApiClientError } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";
import { CollectionForm } from "@/components/features/collection-form";

type FormatKind = "link" | "roadmap" | "note" | "composite";

const FORMAT_OPTIONS: {
  id: FormatKind;
  title: string;
  desc: string;
  defaultType: ResourceType;
  icon: typeof LinkIcon;
}[] = [
  {
    id: "link",
    title: "Resource / Web Link",
    desc: "Interactive courses, documentation, articles, GitHub repositories, or tools.",
    defaultType: "course",
    icon: LinkIcon,
  },
  {
    id: "roadmap",
    title: "Visual Roadmap / Pathway",
    desc: "Learning curriculums, internship prep roadmaps, or study flowcharts.",
    defaultType: "website",
    icon: ImageIcon,
  },
  {
    id: "note",
    title: "Student Guide / Note",
    desc: "Personal revision guides, lab (TP) tips, exam advice, or course notes.",
    defaultType: "docs",
    icon: FileText,
  },
  {
    id: "composite",
    title: "Composite Track",
    desc: "A rich blend of links, recommended tools, and curated references.",
    defaultType: "website",
    icon: Layers,
  },
];

const USE_CASE_PRESETS = [
  "First-time learning",
  "Exam preparation",
  "Internship interview prep",
  "Lab / TP assistance",
  "Project reference",
  "Master's thesis research",
];

const TIME_PRESETS = ["15 min read", "1 hour", "Weekend dive", "1-2 weeks", "Semester-long"];

const CATEGORIES = [
  "AI & Data Science",
  "Computer Science & Software",
  "Mathematics & Foundations",
  "Oil, Gas & Petroleum",
  "Chemical Engineering",
  "Career & Internships",
  "French & Erasmus",
];

export function SubmitWizard() {
  const router = useRouter();
  const [tab, setTab] = useState<"resource" | "collection">("resource");

  // Step state: 1 to 6
  const [step, setStep] = useState<number>(1);

  // Form fields
  const [format, setFormat] = useState<FormatKind>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  // Context fields
  const [useCase, setUseCase] = useState("First-time learning");
  const [timeCommitment, setTimeCommitment] = useState("1 hour");
  const [prerequisites, setPrerequisites] = useState("");
  const [bestPart, setBestPart] = useState("");
  const [warning, setWarning] = useState("");
  const [studentNote, setStudentNote] = useState("");

  // Classification fields
  const [type, setType] = useState<ResourceType>("course");
  const [category, setCategory] = useState("AI & Data Science");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [tagsInput, setTagsInput] = useState("");

  // Submission status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectFormat(f: FormatKind) {
    setFormat(f);
    const opt = FORMAT_OPTIONS.find((o) => o.id === f);
    if (opt) setType(opt.defaultType);
    setStep(2);
  }

  async function handleFinalSubmit() {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(tokenKey) : null;
    if (!token) {
      setError("Please sign in before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      const created = await createResource(token, {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        type,
        category,
        difficulty,
        use_case: useCase.trim() || undefined,
        time_commitment: timeCommitment.trim() || undefined,
        prerequisites: prerequisites.trim() || undefined,
        best_part: bestPart.trim() || undefined,
        warning: warning.trim() || undefined,
        student_note: studentNote.trim() || undefined,
        tags,
      });

      router.push(`/resources/${created.id}` as Route);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to publish resource.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Switcher: Resource vs Collection */}
      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setTab("resource")}
          className={`px-5 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            tab === "resource"
              ? "border-accent text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Adaptive Resource Entry
        </button>
        <button
          type="button"
          onClick={() => setTab("collection")}
          className={`px-5 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            tab === "collection"
              ? "border-accent text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Curated Track / Collection
        </button>
      </div>

      {tab === "collection" ? (
        <div className="border border-line bg-paper p-6 md:p-8">
          <CollectionForm />
        </div>
      ) : (
        <div className="space-y-8">
          {/* 6-Step Stepper Bar */}
          <div className="border border-line bg-paper p-4">
            <div className="grid grid-cols-6 gap-2 text-center font-sans text-[11px] uppercase tracking-wider">
              {[
                "1. Format",
                "2. Content",
                "3. Context",
                "4. Classify",
                "5. Preview",
                "6. Publish",
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (stepNum <= step || (title && url)) setStep(stepNum);
                    }}
                    className={`py-2 px-1 border transition-all ${
                      isActive
                        ? "border-accent bg-accent text-paper font-bold shadow-[2px_2px_0_var(--color-clay)]"
                        : isDone
                        ? "border-line bg-moss/10 text-moss font-bold"
                        : "border-line/40 text-muted opacity-60"
                    }`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{stepNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="border border-red-400/50 bg-red-500/10 p-4 font-sans text-sm text-red-400">
              {error}
            </div>
          )}

          {/* STEP 1: CHOOSE FORMAT */}
          {step === 1 && (
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-accent text-2xl text-ink">Choose what you are sharing</h2>
                <p className="font-sans text-sm text-muted">
                  Pick the format that best describes this contribution to tailor the inputs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectFormat(opt.id)}
                      className={`text-left p-6 border transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? "border-accent bg-accent/5 shadow-[4px_4px_0_var(--color-clay)]"
                          : "border-line bg-paper hover:border-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="p-2 border border-line bg-paper text-ink">
                          <Icon className="h-5 w-5 text-clay" />
                        </span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-clay" />}
                      </div>
                      <div>
                        <h3 className="font-accent text-lg text-ink font-bold">{opt.title}</h3>
                        <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: CONTENT & DETAILS */}
          {step === 2 && (
            <section className="space-y-6 border border-line bg-paper p-6 md:p-8">
              <div className="space-y-1 border-b border-line pb-4">
                <h2 className="font-accent text-2xl text-ink">Content & URLs</h2>
                <p className="font-sans text-sm text-muted">
                  Provide the link and an informative description for fellow UFAZians.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Direct URL <span className="text-clay">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-line bg-paper px-4 py-3 font-sans text-sm text-ink focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
                  />
                  <p className="font-sans text-[11px] text-muted">
                    Official documentation, course link, GitHub repo, or roadmap diagram URL.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Title <span className="text-clay">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={180}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CS231n: Deep Learning for Computer Vision"
                    className="w-full border border-line bg-paper px-4 py-3 font-accent text-lg text-ink focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Detailed Summary / Description <span className="text-clay">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what is covered, how it is organized, and why it is high quality..."
                    className="w-full resize-none border border-line bg-paper px-4 py-3 font-sans text-sm text-ink focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
                  />
                  <p className="font-sans text-[11px] text-muted">
                    Minimum 20 characters. Markdown formatting is supported.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  disabled={!title.trim() || !url.trim() || description.trim().length < 20}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 border border-clay bg-clay px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80 disabled:opacity-50"
                >
                  Next: Student Context <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: STUDENT CONTEXT */}
          {step === 3 && (
            <section className="space-y-6 border border-line bg-paper p-6 md:p-8">
              <div className="space-y-1 border-b border-line pb-4">
                <h2 className="font-accent text-2xl text-ink">Add UFAZ Student Context</h2>
                <p className="font-sans text-sm text-muted">
                  What makes UFAZ Hub valuable is student context: what should juniors watch out for,
                  what are prerequisites, and what is the best part?
                </p>
              </div>

              <div className="space-y-5">
                {/* Use Case */}
                <div className="space-y-2">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Best suited for:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {USE_CASE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setUseCase(preset)}
                        className={`px-3 py-1 font-sans text-xs border transition-all ${
                          useCase === preset
                            ? "border-accent bg-accent text-paper font-bold"
                            : "border-line text-muted hover:border-accent hover:text-ink"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time needed */}
                <div className="space-y-2">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Estimated Time Needed:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTimeCommitment(preset)}
                        className={`px-3 py-1 font-sans text-xs border transition-all ${
                          timeCommitment === preset
                            ? "border-accent bg-accent text-paper font-bold"
                            : "border-line text-muted hover:border-accent hover:text-ink"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Prerequisites <span className="text-muted/60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    placeholder="e.g. Object-Oriented Programming (C++/Java), Basic Calculus"
                    className="w-full border border-line bg-paper px-4 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Best Part */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    The Best Part <span className="text-muted/60">(what makes it stand out?)</span>
                  </label>
                  <input
                    type="text"
                    value={bestPart}
                    onChange={(e) => setBestPart(e.target.value)}
                    placeholder="e.g. Intuitive explanations and practical Python homework exercises."
                    className="w-full border border-line bg-paper px-4 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Warning / Caveat */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Warning / Caveat <span className="text-muted/60">(what to avoid or watch out for?)</span>
                  </label>
                  <input
                    type="text"
                    value={warning}
                    onChange={(e) => setWarning(e.target.value)}
                    placeholder="e.g. Heavy math in lectures 4-6; don't get discouraged if stuck on proofs."
                    className="w-full border border-line bg-paper px-4 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Student Note */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Personal Senior Advice <span className="text-muted/60">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                    placeholder="e.g. Watch at 1.25x speed and clone their starter repository first."
                    className="w-full resize-none border border-line bg-paper px-4 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1 border border-clay bg-clay px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80"
                >
                  Next: Classification <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          )}

          {/* STEP 4: CLASSIFICATION */}
          {step === 4 && (
            <section className="space-y-6 border border-line bg-paper p-6 md:p-8">
              <div className="space-y-1 border-b border-line pb-4">
                <h2 className="font-accent text-2xl text-ink">Classify & Tag</h2>
                <p className="font-sans text-sm text-muted">
                  Make your resource easily discoverable across the search and archive index.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-line bg-paper px-3 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Resource Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full border border-line bg-paper px-3 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="course">Course</option>
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="docs">Documentation</option>
                    <option value="github_repo">GitHub Repo</option>
                    <option value="website">Website / Tool</option>
                    <option value="book">Book</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full border border-line bg-paper px-3 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="beginner">Beginner (L0 – L1)</option>
                    <option value="intermediate">Intermediate (L2 – L3)</option>
                    <option value="advanced">Advanced (M1 / M2)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-muted">
                    Tags <span className="text-muted/60">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. python, deep-learning, pytorch, computer-vision"
                    className="w-full border border-line bg-paper px-3 py-2.5 font-sans text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-1 border border-clay bg-clay px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80"
                >
                  Next: Interactive Preview <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          )}

          {/* STEP 5: LIVE INTERACTIVE PREVIEW */}
          {step === 5 && (
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-accent text-2xl text-ink">Live Hub Preview</h2>
                <p className="font-sans text-sm text-muted">
                  This is exactly how your entry will look on the UFAZ Hub resource page.
                </p>
              </div>

              {/* Preview Card */}
              <div className="border border-line bg-paper p-6 md:p-8 space-y-6 shadow-[4px_4px_0_var(--color-clay)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-line bg-accent/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted">
                      {type}
                    </span>
                    <span className="border border-line bg-accent/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted">
                      {difficulty}
                    </span>
                    <span className="border border-clay/40 bg-clay/10 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-clay font-bold">
                      {category}
                    </span>
                  </div>
                  {timeCommitment && (
                    <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
                      <Clock className="h-3 w-3" /> {timeCommitment}
                    </span>
                  )}
                </div>

                <h1 className="font-accent text-2xl md:text-3xl text-ink leading-tight">
                  {title || "Resource Title Preview"}
                </h1>

                <p className="whitespace-pre-wrap font-sans text-sm text-muted leading-relaxed">
                  {description || "Resource description preview will appear here..."}
                </p>

                {/* Student Context Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line/60 pt-4">
                  {useCase && (
                    <div className="border border-line/60 bg-paper-dark/20 p-3">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-muted block">
                        Best For
                      </span>
                      <span className="font-sans text-xs font-bold text-ink">{useCase}</span>
                    </div>
                  )}

                  {prerequisites && (
                    <div className="border border-line/60 bg-paper-dark/20 p-3">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-muted block">
                        Prerequisites
                      </span>
                      <span className="font-sans text-xs text-ink">{prerequisites}</span>
                    </div>
                  )}

                  {bestPart && (
                    <div className="border border-moss/30 bg-moss/5 p-3 md:col-span-2">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-moss font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> The Best Part
                      </span>
                      <p className="font-sans text-xs text-ink mt-0.5">{bestPart}</p>
                    </div>
                  )}

                  {warning && (
                    <div className="border border-amber-500/30 bg-amber-500/5 p-3 md:col-span-2">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Student Warning / Caveat
                      </span>
                      <p className="font-sans text-xs text-ink mt-0.5">{warning}</p>
                    </div>
                  )}
                </div>

                {tagsInput && (
                  <div className="flex flex-wrap gap-1.5 border-t border-line/40 pt-3">
                    {tagsInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t) => (
                        <span
                          key={t}
                          className="border border-line bg-accent/5 px-2 py-0.5 font-sans text-[10px] text-muted"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1 border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Edit
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="inline-flex items-center gap-1 border border-clay bg-clay px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-accent hover:bg-clay/80 shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                >
                  Proceed to Publish <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          )}

          {/* STEP 6: PUBLISH & CONFIRM */}
          {step === 6 && (
            <section className="border border-line bg-paper p-6 md:p-8 space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto py-4">
                <CheckCircle className="h-10 w-10 text-clay mx-auto" />
                <h2 className="font-accent text-3xl text-ink">Ready to Publish</h2>
                <p className="font-sans text-sm text-muted">
                  Your entry will immediately be added to the permanent UFAZ archive and indexed for
                  all students.
                </p>
              </div>

              <div className="border border-line/70 bg-accent/5 p-4 space-y-2 text-xs font-sans text-muted">
                <p className="font-bold text-ink uppercase tracking-wider">UFAZ Community Pledge:</p>
                <p>
                  • I verify that this material is helpful, accurate, and relevant for UFAZ students.
                </p>
                <p>• The link points to reliable and non-malicious content.</p>
              </div>

              <div className="flex justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 border border-line px-4 py-2 font-sans text-xs uppercase tracking-wider text-muted hover:text-ink disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Preview
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 border border-clay bg-clay px-8 py-3 font-sans text-sm font-bold uppercase tracking-[0.14em] text-accent hover:bg-clay/80 disabled:opacity-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Publishing to UFAZ Hub..." : "Confirm & Publish Now"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
