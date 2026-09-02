"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createResource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { tokenKey } from "@/lib/auth-storage";

const schema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(20).max(2000),
  url: z.string().url(),
  type: z.enum(["course", "article", "video", "docs", "github_repo", "website", "book"]),
  category: z.string().min(2).max(100),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  use_case: z.string().max(80).optional(),
  time_commitment: z.string().max(40).optional(),
  prerequisites: z.string().max(500).optional(),
  best_part: z.string().max(500).optional(),
  warning: z.string().max(500).optional(),
  student_note: z.string().max(800).optional(),
  tags: z.string().max(200)
});

type FormValues = z.infer<typeof schema>;

type ResourceFormProps = {
  initial?: Partial<FormValues>;
  submitLabel?: string;
  onSave?: (payload: {
    title: string;
    description: string;
    url: string;
    type: string;
    category: string;
    difficulty: string;
    use_case?: string;
    time_commitment?: string;
    prerequisites?: string;
    best_part?: string;
    warning?: string;
    student_note?: string;
    tags: string[];
  }) => Promise<void>;
};

export function ResourceForm({ initial, submitLabel = "Submit entry", onSave }: ResourceFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "course",
      difficulty: "beginner",
      use_case: "First time learning",
      time_commitment: "30 min",
      tags: "",
      ...initial
    }
  });

  function optional(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  async function onSubmit(values: FormValues) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      form.setError("root", { message: "Log in first, then submit your entry." });
      return;
    }

    const payload = {
      title: values.title,
      description: values.description,
      url: values.url,
      type: values.type,
      category: values.category,
      difficulty: values.difficulty,
      use_case: optional(values.use_case),
      time_commitment: optional(values.time_commitment),
      prerequisites: optional(values.prerequisites),
      best_part: optional(values.best_part),
      warning: optional(values.warning),
      student_note: optional(values.student_note),
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    };
    if (onSave) {
      await onSave(payload);
      return;
    }
    await createResource(token, payload);
    form.reset({ type: "course", difficulty: "beginner", use_case: "First time learning", time_commitment: "30 min", tags: "" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-8">
        <section className="border-y border-line py-5">
          <div className="text-xs uppercase tracking-[0.16em] text-accent">01 / What is it?</div>
          <div className="mt-4 space-y-4">
            <label className="block font-sans text-sm font-bold">
              Title
              <input {...form.register("title")} placeholder="CS50 SQL notes for database week" className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
            <label className="block font-sans text-sm font-bold">
              Why should a student open this?
              <textarea {...form.register("description")} placeholder="Explain what it helps with, when it helped you, and what problem it solves." className="mt-2 min-h-32 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
            <label className="block font-sans text-sm font-bold">
              Link
              <input {...form.register("url")} placeholder="https://..." className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
          </div>
        </section>

        <section className="border-b border-line pb-5">
          <div className="text-xs uppercase tracking-[0.16em] text-accent">02 / Student context</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block font-sans text-sm font-bold">
              Best for
              <select {...form.register("use_case")} className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none">
                <option>First time learning</option>
                <option>Before exam</option>
                <option>During project</option>
                <option>Internship prep</option>
                <option>Debugging/reference</option>
              </select>
            </label>
            <label className="block font-sans text-sm font-bold">
              Time needed
              <select {...form.register("time_commitment")} className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none">
                <option>10 min</option>
                <option>30 min</option>
                <option>1 hour</option>
                <option>Weekend</option>
                <option>Multi-day reference</option>
              </select>
            </label>
            <label className="block font-sans text-sm font-bold md:col-span-2">
              Prerequisites
              <input {...form.register("prerequisites")} placeholder="Example: basic Python, SELECT queries, or no prior knowledge." className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
            <label className="block font-sans text-sm font-bold md:col-span-2">
              Best part
              <input {...form.register("best_part")} placeholder="Mention the chapter, timestamp, notebook, file, or section worth jumping to." className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
            <label className="block font-sans text-sm font-bold md:col-span-2">
              Warning or caveat
              <input {...form.register("warning")} placeholder="Example: old syntax, skip the intro, assumes calculus, Windows setup is different." className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
            <label className="block font-sans text-sm font-bold md:col-span-2">
              Your note
              <textarea {...form.register("student_note")} placeholder="Add the human bit: how you used it, what finally clicked, or who it is perfect for." className="mt-2 min-h-28 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
            </label>
          </div>
        </section>

        <section className="border-b border-line pb-5">
          <div className="text-xs uppercase tracking-[0.16em] text-accent">03 / Classification</div>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <select {...form.register("type")} className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none">
              <option value="course">Course</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="docs">Docs</option>
              <option value="github_repo">Repository</option>
              <option value="website">Website</option>
              <option value="book">Book</option>
            </select>
            <select {...form.register("difficulty")} className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input {...form.register("category")} placeholder="Category" className="border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
          </div>
          <input {...form.register("tags")} placeholder="Tags, comma separated" className="mt-4 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        </section>

        {form.formState.errors.root ? <p className="text-sm text-accent">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>

      <aside className="h-fit border-t-4 border-line pt-6 lg:border-t-0 lg:border-l-4 lg:pt-0 lg:pl-5">
        <div className="text-xs uppercase tracking-[0.16em] text-accent">Useful entries feel like</div>
        <div className="mt-4 space-y-5 font-sans text-sm leading-6 text-muted">
          <p>A future student should know why this link matters before opening it.</p>
          <p>Name the best section, the time needed, and any traps. That context is the real value.</p>
          <p className="border-t border-line pt-4 font-body text-xs text-accent">Good: "Use chapter 4 for joins before DB week. Skip setup if you already have Postgres."</p>
        </div>
      </aside>
    </form>
  );
}
