"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, UserRound } from "lucide-react";
import type { UserPublic } from "@/types/api";
import { listPeople } from "@/lib/api";

export function PeopleDirectory({ initialPeople }: { initialPeople: UserPublic[] }) {
  const [people, setPeople] = useState<UserPublic[]>(initialPeople);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listPeople(50, query.trim() || undefined);
        setPeople(res.items);
      } catch {
        // keep old list on error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, @username, faculty, or bio keywords..."
          className="w-full border border-line bg-paper pl-10 pr-4 py-3 font-body text-sm transition-all focus:border-accent focus:shadow-[4px_4px_0_var(--color-clay)] focus:outline-none"
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted font-sans animate-pulse">
            Searching...
          </span>
        )}
      </div>

      {/* People list */}
      <div className="divide-y divide-line border-y border-line">
        {people.length === 0 ? (
          <div className="py-12 text-center text-muted font-sans text-sm">
            {query ? `No students or contributors match "${query}".` : "No members found in the directory."}
          </div>
        ) : (
          people.map((person, index) => {
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
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-muted">
                    {person.faculty ?? "UFAZ"} · @{person.username}
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
