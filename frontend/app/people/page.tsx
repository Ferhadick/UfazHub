import { listPeople } from "@/lib/api";
import { PeopleDirectory } from "@/components/features/people-directory";

export const metadata = { title: "People — UFAZ Hub" };

export default async function PeoplePage() {
  const people = await listPeople(100, undefined, { sort: "featured" }).catch(() => ({ items: [], total: 0, limit: 100, offset: 0 }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold text-accent">Community directory</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Find people worth following.</h1>
        <p className="mt-3 text-base leading-7 text-muted">Discover active contributors, researchers, students and alumni by what they do, where they study and what they share.</p>
      </div>
      <PeopleDirectory initialPeople={people.items} />
    </main>
  );
}
