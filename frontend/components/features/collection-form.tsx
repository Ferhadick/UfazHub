"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createCollection, listResources } from "@/lib/api";
import { tokenKey } from "@/lib/auth-storage";
import type { ResourceRead } from "@/types/api";

const schema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(20).max(2000),
  tags: z.string().max(200)
});

type FormValues = z.infer<typeof schema>;

export function CollectionForm() {
  const [resources, setResources] = useState<ResourceRead[]>([]);
  const [selectedResources, setSelectedResources] = useState<ResourceRead[]>([]);
  const [query, setQuery] = useState("");
  const [resourceState, setResourceState] = useState<"loading" | "ready" | "error">("loading");
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tags: "" } });

  useEffect(() => {
    let cancelled = false;
    listResources(100)
      .then((result) => {
        if (cancelled) return;
        setResources(result.items);
        setResourceState("ready");
      })
      .catch(() => {
        if (!cancelled) setResourceState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedIds = new Set(selectedResources.map((resource) => resource.id));
    return resources
      .filter((resource) => !selectedIds.has(resource.id))
      .filter((resource) => {
        if (!normalizedQuery) return true;
        const haystack = [
          resource.title,
          resource.description,
          resource.category,
          resource.type,
          resource.difficulty,
          resource.author.name,
          ...resource.tags.map((tag) => tag.name)
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [query, resources, selectedResources]);

  function addResource(resource: ResourceRead) {
    setSelectedResources((current) => [...current, resource]);
    setQuery("");
    form.clearErrors("root");
  }

  function removeResource(resourceId: string) {
    setSelectedResources((current) => current.filter((resource) => resource.id !== resourceId));
  }

  function moveResource(resourceId: string, direction: -1 | 1) {
    setSelectedResources((current) => {
      const index = current.findIndex((resource) => resource.id === resourceId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [resource] = next.splice(index, 1);
      next.splice(nextIndex, 0, resource);
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      form.setError("root", { message: "Log in first, then create a collection." });
      return;
    }
    if (selectedResources.length === 0) {
      form.setError("root", { message: "Choose at least one resource for this path." });
      return;
    }

    await createCollection(token, {
      title: values.title,
      description: values.description,
      resource_ids: selectedResources.map((resource) => resource.id),
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    });
    setSelectedResources([]);
    form.reset({ tags: "" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <input {...form.register("title")} placeholder="Title" className="w-full border border-line bg-paper px-3 py-3 transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        <textarea {...form.register("description")} placeholder="Description" className="min-h-32 w-full border border-line bg-paper px-3 py-3 transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />

        <section className="border-y border-line py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-accent">Resources in this path</div>
              <p className="mt-2 font-sans text-sm text-muted">Search and add resources. The selected order becomes the collection order.</p>
            </div>
            <span className="font-body text-xs text-muted">{selectedResources.length} selected</span>
          </div>

          <label className="mt-5 flex items-center gap-3 border border-line bg-paper px-3 py-3 transition-all focus-within:border-accent focus-within:shadow-[4px_4px_0_var(--color-clay)]">
            <Search className="h-4 w-4 text-accent" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, tag, author, category..."
              className="w-full bg-transparent outline-none"
            />
          </label>

          <div className="mt-4 divide-y divide-line border-y border-line">
            {resourceState === "loading" ? (
              <div className="py-6 font-sans text-sm text-muted">Loading resources...</div>
            ) : resourceState === "error" ? (
              <div className="py-6 font-sans text-sm text-accent">Could not load resources. Refresh and try again.</div>
            ) : filteredResources.length === 0 ? (
              <div className="py-6 font-sans text-sm text-muted">No matching resources.</div>
            ) : (
              filteredResources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => addResource(resource)}
                  className="grid w-full gap-3 py-4 text-left transition-colors hover:bg-paper/70 sm:grid-cols-[1fr_auto]"
                >
                  <span>
                    <span className="block font-accent text-xl leading-tight">{resource.title}</span>
                    <span className="mt-1 block font-sans text-xs text-muted">
                      {resource.category} / {resource.difficulty} / {resource.author.name}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 self-start border border-line px-3 py-2 font-sans text-xs font-bold text-accent">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <input {...form.register("tags")} placeholder="Tags, comma separated" className="w-full border border-line bg-paper px-3 py-3 transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
        {form.formState.errors.root ? <p className="text-sm text-accent">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create collection"}
        </Button>
      </div>

      <aside className="h-fit border-l-4 border-line pl-5">
        <div className="text-xs uppercase tracking-[0.16em] text-accent">Selected order</div>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {selectedResources.length === 0 ? (
            <div className="py-6 font-sans text-sm text-muted">Pick resources from the search list.</div>
          ) : (
            selectedResources.map((resource, index) => (
              <div key={resource.id} className="py-4">
                <div className="flex items-start gap-3">
                  <span className="font-accent text-xl text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-sm font-bold leading-5">{resource.title}</div>
                    <div className="mt-1 text-[11px] text-muted">{resource.category}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 pl-9">
                  <button
                    type="button"
                    onClick={() => moveResource(resource.id, -1)}
                    disabled={index === 0}
                    className="border border-line p-1.5 text-accent transition-colors hover:bg-clay disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Move ${resource.title} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveResource(resource.id, 1)}
                    disabled={index === selectedResources.length - 1}
                    className="border border-line p-1.5 text-accent transition-colors hover:bg-clay disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Move ${resource.title} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeResource(resource.id)}
                    className="border border-line p-1.5 text-accent transition-colors hover:bg-clay"
                    aria-label={`Remove ${resource.title}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </form>
  );
}
