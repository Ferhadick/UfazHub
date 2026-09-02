"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, Trash2, Github, Linkedin, Send, Youtube, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAvatar, getMe, updateMe, uploadAvatar } from "@/lib/api";
import { saveAuthSession, tokenKey } from "@/lib/auth-storage";
import type { UserPublic } from "@/types/api";

const schema = z.object({
  name: z.string().min(2).max(120),
  bio: z.string().max(1000).optional(),
  faculty: z.string().max(120).optional(),
  github_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  telegram_url: z.string().url().optional().or(z.literal("")),
  youtube_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal(""))
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [message, setMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setMessage("Log in first, then return here.");
      return;
    }
    getMe(token)
      .then((loadedUser) => {
        setUser(loadedUser);
        form.reset({
          name: loadedUser.name,
          bio: loadedUser.bio ?? "",
          faculty: loadedUser.faculty ?? "",
          github_url: loadedUser.github_url ?? "",
          linkedin_url: loadedUser.linkedin_url ?? "",
          telegram_url: loadedUser.telegram_url ?? "",
          youtube_url: loadedUser.youtube_url ?? "",
          website_url: loadedUser.website_url ?? ""
        });
      })
      .catch(() => setMessage("Could not load your profile."));
  }, [form]);

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 3MB.");
      return;
    }
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return;

    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const updatedUser = await uploadAvatar(token, file);
      setUser(updatedUser);
      saveAuthSession(token, updatedUser);
      setMessage("Avatar updated successfully.");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAvatarDelete() {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const updatedUser = await deleteAvatar(token);
      setUser(updatedUser);
      saveAuthSession(token, updatedUser);
      setMessage("Avatar removed.");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setMessage("Log in first, then return here.");
      return;
    }
    const updatedUser = await updateMe(token, {
      name: values.name,
      bio: values.bio || undefined,
      faculty: values.faculty || undefined,
      github_url: values.github_url || undefined,
      linkedin_url: values.linkedin_url || undefined,
      telegram_url: values.telegram_url || undefined,
      youtube_url: values.youtube_url || undefined,
      website_url: values.website_url || undefined
    });
    setUser(updatedUser);
    saveAuthSession(token, updatedUser);
    setMessage("Profile details saved successfully.");
  }

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <section className="border border-line bg-paper p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">Profile Picture</div>
        <p className="mt-1 font-sans text-xs text-muted">Upload an avatar (JPG, PNG, WebP up to 3MB). It will appear across the site.</p>
        
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-4 border-accent bg-clay font-accent text-3xl text-accent">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploadingAvatar ? "Uploading..." : "Upload picture"}
              </Button>
              {user?.avatar_url && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingAvatar}
                  onClick={handleAvatarDelete}
                  className="flex items-center gap-2 text-xs text-red-700 hover:border-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
            {avatarError && <p className="font-sans text-xs text-red-700">{avatarError}</p>}
          </div>
        </div>
      </section>

      {/* Main Profile Info & Socials */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4 border border-line bg-paper p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">Personal Information</div>
          
          <label className="block font-sans text-sm font-bold">
            Full name
            <input {...form.register("name")} placeholder="Your name" className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
          </label>
          <label className="block font-sans text-sm font-bold">
            Faculty / Specialty
            <input {...form.register("faculty")} placeholder="e.g. Computer Science, Oil & Gas, etc." className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
          </label>
          <label className="block font-sans text-sm font-bold">
            Bio
            <textarea {...form.register("bio")} placeholder="Write a short summary about yourself..." className="mt-1 min-h-28 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none" />
          </label>
        </section>

        {/* Social Links Section */}
        <section className="space-y-4 border border-line bg-paper p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-accent font-bold">Social Links</div>
          <p className="font-sans text-xs text-muted">Add your external profiles to showcase on your public page.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-sans text-sm font-bold">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Github className="h-3.5 w-3.5" /> GitHub URL
              </span>
              <input {...form.register("github_url")} placeholder="https://github.com/..." className="mt-1 w-full border border-line bg-paper px-3 py-2.5 font-body font-normal text-xs transition-all focus:border-accent focus:outline-none" />
            </label>

            <label className="block font-sans text-sm font-bold">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn URL
              </span>
              <input {...form.register("linkedin_url")} placeholder="https://linkedin.com/in/..." className="mt-1 w-full border border-line bg-paper px-3 py-2.5 font-body font-normal text-xs transition-all focus:border-accent focus:outline-none" />
            </label>

            <label className="block font-sans text-sm font-bold">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Send className="h-3.5 w-3.5" /> Telegram URL / handle
              </span>
              <input {...form.register("telegram_url")} placeholder="https://t.me/..." className="mt-1 w-full border border-line bg-paper px-3 py-2.5 font-body font-normal text-xs transition-all focus:border-accent focus:outline-none" />
            </label>

            <label className="block font-sans text-sm font-bold">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Youtube className="h-3.5 w-3.5" /> YouTube Channel
              </span>
              <input {...form.register("youtube_url")} placeholder="https://youtube.com/@..." className="mt-1 w-full border border-line bg-paper px-3 py-2.5 font-body font-normal text-xs transition-all focus:border-accent focus:outline-none" />
            </label>

            <label className="block font-sans text-sm font-bold sm:col-span-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Globe className="h-3.5 w-3.5" /> Personal Website / Portfolio
              </span>
              <input {...form.register("website_url")} placeholder="https://..." className="mt-1 w-full border border-line bg-paper px-3 py-2.5 font-body font-normal text-xs transition-all focus:border-accent focus:outline-none" />
            </label>
          </div>
        </section>

        {message ? (
          <p className="flex items-center gap-2 border border-line bg-clay/50 p-3 text-sm font-bold text-accent">
            <Check className="h-4 w-4" /> {message}
          </p>
        ) : null}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting ? "Saving..." : "Save profile changes"}
        </Button>
      </form>
    </div>
  );
}

