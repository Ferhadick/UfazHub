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
    const result = await loginUser(values);
    saveAuthSession(result.access_token, result.user);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <input {...form.register("email")} placeholder="Email" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("password")} type="password" placeholder="Password" className="w-full border border-line bg-paper px-3 py-3" />
      <Button type="submit" disabled={form.formState.isSubmitting}>Log in</Button>
    </form>
  );
}
