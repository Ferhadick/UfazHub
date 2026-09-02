"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getMe, updateMe } from "@/lib/api";
import { saveAuthSession, tokenKey } from "@/lib/auth-storage";

const schema = z.object({
  name: z.string().min(2).max(120),
  bio: z.string().max(1000).optional(),
  faculty: z.string().max(120).optional(),
  avatar_url: z.string().url().optional().or(z.literal(""))
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm() {
  const [message, setMessage] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setMessage("Log in first, then return here.");
      return;
    }
    getMe(token)
      .then((user) => form.reset({ name: user.name, bio: user.bio ?? "", faculty: user.faculty ?? "", avatar_url: user.avatar_url ?? "" }))
      .catch(() => setMessage("Could not load your profile."));
  }, [form]);

  async function onSubmit(values: FormValues) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setMessage("Log in first, then return here.");
      return;
    }
    const user = await updateMe(token, {
      name: values.name,
      bio: values.bio || undefined,
      faculty: values.faculty || undefined,
      avatar_url: values.avatar_url || undefined
    });
    saveAuthSession(token, user);
    setMessage("Profile saved.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <label className="block font-sans text-sm font-bold">
        Full name
        <input {...form.register("name")} placeholder="Your name" className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
      </label>
      <label className="block font-sans text-sm font-bold">
        Faculty / Speciality
        <input {...form.register("faculty")} placeholder="e.g. Computer Science, Oil & Gas, etc." className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
      </label>
      <label className="block font-sans text-sm font-bold">
        Avatar URL (optional)
        <input {...form.register("avatar_url")} placeholder="https://..." className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
      </label>
      <label className="block font-sans text-sm font-bold">
        Bio
        <textarea {...form.register("bio")} placeholder="Write a short summary about yourself..." className="mt-1 min-h-32 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
      </label>
      {message ? <p className="text-sm font-bold text-accent">{message}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
        {form.formState.isSubmitting ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
