import Link from "next/link";
import { SubmitWizard } from "@/components/features/submit-wizard";
import { WriteBlockedNotice } from "@/components/features/write-blocked-notice";

export const metadata = { title: "Share — UFAZ Hub" };

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-9 md:px-8 md:py-12">
      <div className="mb-8 max-w-3xl border-b border-line pb-6">
        <p className="mb-2 text-sm font-semibold text-accent">Contribute to UFAZ Hub</p>
        <h1 className="font-accent text-4xl font-semibold tracking-tight md:text-5xl">Share what helped you.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Write in Markdown, paste a useful link, attach a file, or mark the post as research. UFAZ Hub handles the content type and technical metadata for you.
        </p>
      </div>
      <WriteBlockedNotice>
        <SubmitWizard />
      </WriteBlockedNotice>
      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Want to group several resources in order? <Link href="/collections/new" className="font-medium text-accent hover:underline">Create a collection</Link>.
      </p>
    </main>
  );
}
