import { listPeople } from "@/lib/api";
import { PeopleDirectory } from "@/components/features/people-directory";

export default async function PeoplePage() {
  const people = await listPeople(50).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">03 / People</div>
        <h1 className="mt-2 font-accent text-4xl leading-none md:text-6xl">Good neighbours</h1>
        <p className="mt-3 font-sans text-sm text-muted">UFAZ students, contributors, and readers shaping the index.</p>
      </div>
      <PeopleDirectory initialPeople={people.items} />
    </main>
  );
}
