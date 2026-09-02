"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { saveAuthSession } from "@/lib/auth-storage";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const result = await loginUser(values);
      saveAuthSession(result.access_token, result.user);
      router.push("/");
      router.refresh();
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Incorrect email or password." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <label className="block font-sans text-sm font-bold">
        Email
        <input
          {...form.register("email")}
          type="email"
          placeholder="your.email@ufaz.az"
          className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        {form.formState.errors.email ? (
          <p className="mt-1 text-xs font-normal text-accent">{form.formState.errors.email.message}</p>
        ) : null}
      </label>
      <label className="block font-sans text-sm font-bold">
        Password
        <input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        {form.formState.errors.password ? (
          <p className="mt-1 text-xs font-normal text-accent">{form.formState.errors.password.message}</p>
        ) : null}
      </label>
      {form.formState.errors.root ? (
        <p className="border border-accent bg-accent/5 px-3 py-2 text-sm font-bold text-accent">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
