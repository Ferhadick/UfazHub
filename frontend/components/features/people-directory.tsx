"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { BriefcaseBusiness, FlaskConical, GraduationCap, Search, ShieldCheck } from "lucide-react";
import type { UserPublic } from "@/types/api";
import { listPeople } from "@/lib/api";

type GroupFilter = "all" | "researchers" | "verified" | "students" | "alumni";
type SortMode = "featured" | "reputation" | "newest" | "name";

const filters: Array<{ id: GroupFilter; label: string }> = [
  { id: "all", label: "Everyone" },
  { id: "researchers", label: "Researchers" },
  { id: "verified", label: "Verified" },
  { id: "students", label: "Students" },
  { id: "alumni", label: "Alumni" }
];

function isResearcher(person: UserPublic) {
  const value = `${person.current_role ?? ""} ${person.bio ?? ""} ${person.company_or_institution ?? ""} ${person.degree_level ?? ""}`.toLowerCase();
  return ["research", "phd", "doctoral", "professor", "scientist", "laboratory", " lab"].some((term) => value.includes(term));
}

function PersonCard({ person, featured = false }: { person: UserPublic; featured?: boolean }) {
  const initials = person.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const researcher = isResearcher(person);
  const verified = person.is_verified || person.role === "verified_ufazian" || person.role === "admin";

  return (
    <Link
      href={`/profile/${person.username}` as Route}
      className={`group block rounded-lg border bg-paper transition-colors hover:border-accent/60 hover:bg-surface ${featured ? "border-accent/25 p-6" : "border-line p-5"}`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay font-semibold text-accent ${featured ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"}`}>
          {person.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${featured ? "text-base" : "text-sm"} truncate font-semibold text-ink group-hover:text-accent`}>{person.name}</span>
            {verified ? <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-label="Verified" /> : null}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">@{person.username}</div>
        </div>
      </div>

      <div className="mt-4 min-h-10">
        {person.current_role ? <p className="text-sm font-medium leading-5 text-ink">{person.current_role}</p> : null}
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{person.bio || person.faculty || "UFAZ community member"}</p>
      </div>

      {(person.company_or_institution || person.faculty) ? (
        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
          {researcher ? <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : person.current_role ? <BriefcaseBusiness className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span className="line-clamp-2">{person.company_or_institution || person.faculty}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[11px] text-muted">
        {researcher ? <span className="rounded-full bg-clay px-2 py-1 text-accent">Research</span> : null}
        {person.faculty ? <span>{person.faculty}</span> : null}
        <span className="ml-auto font-medium text-ink">{person.reputation_score} rep</span>
      </div>
    </Link>
  );
}

export function PeopleDirectory({ initialPeople }: { initialPeople: UserPublic[] }) {
  const [people, setPeople] = useState<UserPublic[]>(initialPeople);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [faculty, setFaculty] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<string[]>(() => Array.from(new Set(initialPeople.map((person) => person.faculty).filter((value): value is string => Boolean(value)))).sort());

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listPeople(100, query.trim() || undefined, { group, faculty: faculty || undefined, sort });
        setPeople(res.items);
        setFaculties((current) => Array.from(new Set([...current, ...res.items.map((person) => person.faculty).filter((value): value is string => Boolean(value))])).sort());
      } catch {
        // Keep the last successful list visible.
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, group, faculty, sort]);

  const showFeatured = !query.trim() && group === "all" && !faculty && sort === "featured";
  const featuredPeople = showFeatured ? people.slice(0, 3) : [];
  const remainingPeople = useMemo(() => showFeatured ? people.slice(3) : people, [people, showFeatured]);

  return (
    <div className="space-y-7">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, role, faculty or institution"
            className="w-full rounded-md border border-line bg-paper py-3 pl-10 pr-24 text-sm outline-none focus:border-accent"
          />
          {loading ? <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">Updating...</span> : null}
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setGroup(filter.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${group === filter.id ? "border-accent bg-clay text-accent" : "border-line bg-paper text-muted hover:text-ink"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={faculty} onChange={(event) => setFaculty(event.target.value)} className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-accent">
              <option value="">All faculties</option>
              {faculties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-accent">
              <option value="featured">Most relevant</option>
              <option value="reputation">Highest reputation</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {featuredPeople.length ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-semibold">Featured people</h2>
              <p className="mt-1 text-xs text-muted">Ranked by contribution, verification and profile depth.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {featuredPeople.map((person) => <PersonCard key={person.id} person={person} featured />)}
          </div>
        </section>
      ) : null}

      <section>
        {showFeatured && remainingPeople.length ? <h2 className="mb-3 font-serif text-xl font-semibold">More people</h2> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remainingPeople.length === 0 ? (
            <div className="col-span-full rounded-lg border border-line bg-paper-50 p-10 text-center text-sm text-muted">No people match these filters.</div>
          ) : remainingPeople.map((person) => <PersonCard key={person.id} person={person} />)}
        </div>
      </section>
    </div>
  );
}
