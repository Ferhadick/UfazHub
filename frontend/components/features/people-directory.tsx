"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, UserRound } from "lucide-react";
import type { UserPublic } from "@/types/api";
import { listPeople } from "@/lib/api";

type RoleFilter = "all" | "verified" | "alumni" | "students";

export function PeopleDirectory({ initialPeople }: { initialPeople: UserPublic[] }) {
  const [people, setPeople] = useState<UserPublic[]>(initialPeople);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rep" | "name" | "year">("rep");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listPeople(100, query.trim() || undefined);
        setPeople(res.items);
      } catch {
        // keep old list on error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const currentYear = new Date().getFullYear();

  const filteredPeople = people
    .filter((person) => {
      if (roleFilter === "verified" && !person.is_verified && person.role !== "verified_ufazian") {
        return false;
      }
      if (roleFilter === "alumni") {
        const isAlumni =
          person.degree_level === "Alumni" ||
          (person.graduation_year && person.graduation_year <= currentYear);
        if (!isAlumni) return false;
      }
      if (roleFilter === "students") {
        const isStudent =
          !person.graduation_year || person.graduation_year > currentYear;
        if (!isStudent) return false;
      }
      if (facultyFilter !== "all") {
        const faculty = (person.faculty ?? "").toLowerCase();
        if (!faculty.includes(facultyFilter.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rep") return b.reputation_score - a.reputation_score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "year") return (b.graduation_year ?? 0) - (a.graduation_year ?? 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, @username, faculty, role, or company..."
            className="w-full border border-line bg-paper pl-10 pr-4 py-3 font-body text-sm transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
          />
          {loading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted font-sans animate-pulse">
              Searching...
            </span>
          )}
        </div>

        {/* Faculty filter */}
        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className="border border-line bg-paper px-3 py-3 font-sans text-xs text-ink focus:border-accent focus:outline-none"
        >
          <option value="all">All Specialties</option>
          <option value="computer science">Computer Science</option>
          <option value="data">Data Science / AI</option>
          <option value="petroleum">Oil & Gas / Petroleum</option>
          <option value="chemical">Chemical Engineering</option>
          <option value="geophys">Geophysics</option>
        </select>

        {/* Sort filter */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "rep" | "name" | "year")}
          className="border border-line bg-paper px-3 py-3 font-sans text-xs text-ink focus:border-accent focus:outline-none"
        >
          <option value="rep">Sort by Reputation</option>
          <option value="year">Sort by Class Year</option>
          <option value="name">Sort Alphabetically</option>
        </select>
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "All Members" },
            { id: "verified", label: "Verified UFAZians" },
            { id: "alumni", label: "Alumni" },
            { id: "students", label: "Current Students" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleFilter(tab.id)}
            className={`border px-3 py-1.5 font-sans text-xs uppercase tracking-wider transition-all ${
              roleFilter === tab.id
                ? "border-accent bg-accent text-paper font-bold"
                : "border-line text-muted hover:border-accent hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto font-sans text-xs text-muted">
          Showing {filteredPeople.length} members
        </span>
      </div>

      {/* People list */}
      <div className="divide-y divide-line border-y border-line">
        {filteredPeople.length === 0 ? (
          <div className="py-12 text-center text-muted font-sans text-sm">
            {query ? `No students or contributors match "${query}".` : "No members found in this category."}
          </div>
        ) : (
          filteredPeople.map((person, index) => {
            const initials = person.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={person.id}
                href={`/profile/${person.username}` as Route}
                className="grid gap-3 py-5 transition-colors hover:bg-paper/70 md:grid-cols-[3.5rem_3.5rem_1fr_6rem] md:gap-4 items-center"
              >
                <div className="flex items-baseline justify-between gap-4 md:block">
                  <div className="font-accent text-2xl text-muted">{String(index + 1).padStart(2, "0")}</div>
                  <div className="font-accent text-2xl md:hidden">{person.reputation_score} rep</div>
                </div>

                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-line bg-clay font-accent text-lg text-accent">
                  {person.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-accent text-xl break-words sm:text-2xl text-ink hover:text-accent">
                      {person.name}
                    </h2>
                    {person.role === "admin" && (
                      <span className="border border-line bg-clay/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent font-bold">
                        Admin
                      </span>
                    )}
                    {person.is_verified && (
                      <span className="border border-clay/50 bg-clay/15 text-clay px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-muted">
                    {person.current_role ? `${person.current_role}${person.company_or_institution ? ` @ ${person.company_or_institution}` : ""} · ` : ""}
                    {person.faculty ?? "UFAZ"}
                    {person.graduation_year ? ` '${String(person.graduation_year).slice(-2)}` : ""} · @{person.username}
                  </p>
                  {person.bio && (
                    <p className="mt-2 max-w-2xl font-sans text-xs leading-5 text-muted line-clamp-2">
                      {person.bio}
                    </p>
                  )}
                </div>

                {/* Rep score */}
                <div className="hidden text-right font-accent text-xl md:block text-accent">
                  {person.reputation_score} <span className="text-[10px] uppercase font-sans text-muted">rep</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
