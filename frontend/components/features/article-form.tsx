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
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <input {...form.register("title")} placeholder="Title" className="w-full border border-line bg-paper px-3 py-3" />
        <textarea {...form.register("excerpt")} placeholder="Excerpt" className="min-h-24 w-full border border-line bg-paper px-3 py-3" />
        <textarea
          {...form.register("content")}
          onChange={(event) => {
            form.setValue("content", event.target.value);
            setPreview(event.target.value);
          }}
          placeholder="Markdown content"
          className="min-h-72 w-full border border-line bg-paper px-3 py-3"
        />
        <input {...form.register("tags")} placeholder="Tags, comma separated" className="w-full border border-line bg-paper px-3 py-3" />
        <select {...form.register("status")} className="w-full border border-line bg-paper px-3 py-3">
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {form.formState.errors.root ? <p className="text-sm text-accent">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : submitLabel}</Button>
      </div>
      <div className="border border-line p-4">
        <div className="mb-4 text-xs uppercase tracking-[0.16em] text-muted">Preview</div>
        <div className="whitespace-pre-wrap leading-7">{preview || "Your note preview will appear here."}</div>
      </div>
    </form>
  );
}
