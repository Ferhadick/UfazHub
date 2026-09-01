"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { saveAuthSession } from "@/lib/auth-storage";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  name: z.string().min(2),
  faculty: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await registerUser(values);
    saveAuthSession(result.access_token, result.user);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <input {...form.register("email")} placeholder="Email" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("username")} placeholder="Username" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("name")} placeholder="Name" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("faculty")} placeholder="Faculty" className="w-full border border-line bg-paper px-3 py-3" />
      <input {...form.register("password")} type="password" placeholder="Password" className="w-full border border-line bg-paper px-3 py-3" />
      <Button type="submit" disabled={form.formState.isSubmitting}>Create account</Button>
    </form>
  );
}
