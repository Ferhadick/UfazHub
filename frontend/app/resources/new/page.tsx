import { ResourceForm } from "@/components/features/resource-form";
import { WriteBlockedNotice } from "@/components/features/write-blocked-notice";

export default function NewResourcePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Submit / Resource</div>
        <h1 className="mt-2 font-accent text-5xl">Leave a useful entry.</h1>
      </div>
      <WriteBlockedNotice>
        <ResourceForm />
      </WriteBlockedNotice>
    </main>
  );
}

