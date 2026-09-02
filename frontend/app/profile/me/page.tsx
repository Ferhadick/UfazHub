import { ProfileForm } from "@/components/features/profile-form";

export default function MyProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Account</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-5xl">Edit profile</h1>
      </div>
      <ProfileForm />
    </main>
  );
}

