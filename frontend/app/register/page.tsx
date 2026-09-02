import { RegisterForm } from "@/components/features/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Account</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-5xl">Sign up</h1>
      </div>
      <RegisterForm />
      <p className="mt-6 border-t border-line pt-5 font-sans text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="border-b border-line font-bold text-accent transition-colors hover:border-accent hover:bg-clay">
          Log in
        </Link>
      </p>
    </main>
  );
}
