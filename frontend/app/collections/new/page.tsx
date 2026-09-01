import { CollectionForm } from "@/components/features/collection-form";

export default function NewCollectionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Submit / Collection</div>
        <h1 className="mt-2 font-accent text-5xl">Create a path.</h1>
      </div>
      <CollectionForm />
    </main>
  );
}

