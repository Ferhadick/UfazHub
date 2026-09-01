import { LoginForm } from "@/components/features/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Account</div>
        <h1 className="mt-2 font-accent text-5xl">Log in</h1>
      </div>
      <LoginForm />
      <p className="mt-6 border-t border-line pt-5 font-sans text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="border-b border-line font-bold text-accent transition-colors hover:border-accent hover:bg-clay">
          Create an account
        </Link>
      </p>
    </main>
  );
}
