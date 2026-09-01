import { listPeople } from "@/lib/api";
import Link from "next/link";

export default async function PeoplePage() {
  const people = await listPeople(50).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10 border-t border-line pt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">03 / People</div>
        <h1 className="mt-2 font-accent text-6xl">Good neighbours</h1>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {people.items.map((person, index) => (
          <Link key={person.id} href={`/profile/${person.username}`} className="grid gap-4 py-5 transition-colors hover:bg-paper/70 md:grid-cols-[4rem_1fr_8rem]">
            <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2 className="font-accent text-3xl">{person.name}</h2>
              <p className="mt-1 font-sans text-sm text-muted">{person.faculty ?? "UFAZ"} / @{person.username}</p>
              <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted">
                {person.bio ?? "View profile, contact details, and published contributions."}
              </p>
            </div>
            <div className="text-right font-accent text-2xl">{person.reputation_score}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
