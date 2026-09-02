"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createArticle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { tokenKey } from "@/lib/auth-storage";

const schema = z.object({
  title: z.string().min(3).max(180),
  content: z.string().min(40),
  excerpt: z.string().max(400).optional(),
  status: z.enum(["draft", "published"]),
  tags: z.string().max(200)
});

type FormValues = z.infer<typeof schema>;

type ArticleFormProps = {
  initial?: Partial<FormValues>;
  submitLabel?: string;
  onSave?: (payload: {
    title: string;
    content: string;
    excerpt?: string;
    status: "draft" | "published";
    tags: string[];
  }) => Promise<void>;
};

export function ArticleForm({ initial, submitLabel = "Publish note", onSave }: ArticleFormProps) {
  const [preview, setPreview] = useState(initial?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "published", tags: "", ...initial }
  });

  async function onSubmit(values: FormValues) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      form.setError("root", { message: "Log in first, then publish your note." });
      return;
    }

    const payload = {
      title: values.title,
      content: values.content,
      excerpt: values.excerpt || undefined,
      status: values.status,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    };
    if (onSave) {
      await onSave(payload);
      return;
    }
    await createArticle(token, payload);
    form.reset({ status: "published", tags: "" });
    setPreview("");
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`flex-1 border py-2 font-sans text-xs font-bold uppercase tracking-wider ${
            tab === "write" ? "border-accent bg-accent text-paper" : "border-line bg-paper text-muted"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`flex-1 border py-2 font-sans text-xs font-bold uppercase tracking-wider ${
            tab === "preview" ? "border-accent bg-accent text-paper" : "border-line bg-paper text-muted"
          }`}
        >
          Preview
        </button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
        <div className={`space-y-4 ${tab === "preview" ? "hidden md:block" : "block"}`}>
          <label className="block font-sans text-sm font-bold">
            Title
            <input
              {...form.register("title")}
              placeholder="Title of your field note"
              className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
            />
          </label>
          <label className="block font-sans text-sm font-bold">
            Excerpt
            <textarea
              {...form.register("excerpt")}
              placeholder="A brief summary for cards and lists"
              className="mt-1 min-h-24 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
            />
          </label>
          <label className="block font-sans text-sm font-bold">
            Markdown content
            <textarea
              {...form.register("content")}
              onChange={(event) => {
                form.setValue("content", event.target.value);
                setPreview(event.target.value);
              }}
              placeholder="Write your note in Markdown..."
              className="mt-1 min-h-72 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-sans text-sm font-bold">
              Tags
              <input
                {...form.register("tags")}
                placeholder="Python, Math, Exam"
                className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
              />
            </label>
            <label className="block font-sans text-sm font-bold">
              Status
              <select
                {...form.register("status")}
                className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>
          {form.formState.errors.root ? <p className="text-sm text-accent">{form.formState.errors.root.message}</p> : null}
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
            {form.formState.isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
        <div className={`border border-line p-4 ${tab === "write" ? "hidden md:block" : "block"}`}>
          <div className="mb-4 text-xs uppercase tracking-[0.16em] text-muted">Preview</div>
          <div className="whitespace-pre-wrap font-sans text-sm leading-7 text-ink break-words sm:text-base">
            {preview || "Your note preview will appear here."}
          </div>
        </div>
      </form>
    </div>
  );
}
