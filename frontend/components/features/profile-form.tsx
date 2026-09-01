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
      <input {...form.register("name")} placeholder="Name" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("faculty")} placeholder="Faculty" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("avatar_url")} placeholder="Avatar URL" className="w-full border border-line bg-paper px-3 py-3" />
      <textarea {...form.register("bio")} placeholder="Bio" className="min-h-32 w-full border border-line bg-paper px-3 py-3" />
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>Save profile</Button>
    </form>
  );
}
