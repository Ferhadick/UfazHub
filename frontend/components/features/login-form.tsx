"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { saveAuthSession } from "@/lib/auth-storage";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
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
      form.setError("root", { message: err instanceof Error ? err.message : "Invalid credentials" });
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
      </label>
      <label className="block font-sans text-sm font-bold">
        Password
        <input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          className="mt-1 w-full border border-line bg-paper px-3 py-3 font-body font-normal transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
      </label>
      {form.formState.errors.root ? <p className="text-sm font-bold text-accent">{form.formState.errors.root.message}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
