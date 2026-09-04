import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import { HeroBrowseLinks } from "@/components/features/hero-browse-links";
import { HomeFeedSection } from "@/components/features/home-feed-section";
import { SearchLauncher } from "@/components/features/search-launcher";
import { listCollections, listFeed, listPeople, listTags } from "@/lib/api";

export default async function HomePage() {
  const [feed, tags, collections, people] = await Promise.all([
    listFeed(10).catch(() => []),
    listTags(6).catch(() => []),
    listCollections(3).catch(() => ({ items: [], total: 0, limit: 3, offset: 0 })),
    listPeople(4).catch(() => ({ items: [], total: 0, limit: 4, offset: 0 }))
  ]);

  return (
    <main>
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">UFAZ community library</p>
            <h1 className="hero-title max-w-2xl">Notes, resources and answers from people at UFAZ.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">
              Search what students have shared, ask a question, or add something useful for the next person.
            </p>
            <SearchLauncher />
            <HeroBrowseLinks tags={tags.length ? tags.map((tag) => tag.name) : ["Python", "Math", "Internships"]} />
          </div>

          <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <p className="text-sm font-semibold text-ink">Have something useful?</p>
            <p className="mt-2 text-sm leading-6 text-muted">Paste Markdown, add a link, or upload a file. The form handles the rest.</p>
            <Link
              href={"/submit" as Route}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Share with UFAZ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">Research at UFAZ Hub</div>
            <h2 className="mt-1 font-serif text-2xl font-semibold">Projects, papers and people behind the work.</h2>
            <p className="mt-2 text-sm leading-6 text-muted">A dedicated place for student and faculty research, from an early project idea to a paper, dataset or reproducible codebase.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4 text-sm font-semibold">
            <Link href={"/research" as Route} className="text-accent hover:underline">Browse research</Link>
            <Link href={"/submit?research=1" as Route} className="text-accent hover:underline">Share research</Link>
          </div>
        </div>
      </section>

      <section id="index" className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <HomeFeedSection items={feed} />

          <aside className="space-y-9">
            <section>
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <h2 className="font-serif text-lg font-semibold">Collections</h2>
                <Link href="/collections" className="text-xs font-medium text-accent hover:underline">All collections</Link>
              </div>
              <div className="divide-y divide-line">
                {collections.items.length === 0 ? (
                  <p className="py-4 text-sm text-muted">No collections yet.</p>
                ) : (
                  collections.items.map((collection) => (
                    <Link key={collection.id} href={`/collections/${collection.id}`} className="block py-4 first:pt-2 hover:text-accent">
                      <div className="text-sm font-semibold text-ink">{collection.title}</div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{collection.description}</p>
                      <div className="mt-2 text-xs text-muted">{collection.items.length} resources</div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <h2 className="font-serif text-lg font-semibold">Contributors</h2>
                <Link href="/people" className="text-xs font-medium text-accent hover:underline">All people</Link>
              </div>
              <div className="divide-y divide-line">
                {people.items.length === 0 ? <p className="py-4 text-sm text-muted">No contributors yet.</p> : null}
                {people.items.slice(0, 4).map((person) => (
                  <Link key={person.id} href={`/profile/${person.username}`} className="flex items-center gap-3 py-3 hover:bg-surface">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay text-xs font-semibold text-accent">
                      {person.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{person.name}</span>
                      <span className="block truncate text-xs text-muted">{person.current_role ?? person.faculty ?? "UFAZ"}</span>
                    </span>
                    <span className="text-xs text-muted">{person.reputation_score}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
