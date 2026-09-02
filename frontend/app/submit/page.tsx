import { SubmitWizard } from "@/components/features/submit-wizard";
import { WriteBlockedNotice } from "@/components/features/write-blocked-notice";

export const metadata = { title: "Submit Knowledge — UFAZ Hub" };

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Contribute / Share</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-5xl">Submit to UFAZ Hub</h1>
        <p className="mt-3 font-sans text-sm text-muted">
          Leave high-value courses, roadmaps, exam notes, or curated tracks for the UFAZ student community.
        </p>
      </div>
      <WriteBlockedNotice>
        <SubmitWizard />
      </WriteBlockedNotice>
    </main>
  );
}
