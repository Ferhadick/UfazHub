import Link from "next/link";
import type { Route } from "next";
import { HeroBrowseLinks } from "@/components/features/hero-browse-links";
import { HomeFeedSection } from "@/components/features/home-feed-section";
import { SearchLauncher } from "@/components/features/search-launcher";
import { listCollections, listFeed, listPeople, listTags } from "@/lib/api";

export default async function HomePage() {
  const [feed, tags, collections, people] = await Promise.all([
    listFeed(8).catch(() => []),
    listTags(6).catch(() => []),
    listCollections(3).catch(() => ({ items: [], total: 0, limit: 3, offset: 0 })),
    listPeople(4).catch(() => ({ items: [], total: 0, limit: 4, offset: 0 }))
  ]);
  const pathCards = collections.items.slice(0, 2).map((collection) => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    count: collection.items.length,
    href: `/collections/${collection.id}` as Route
  }));

  return (
    <main>
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 md:grid-cols-[1.35fr_0.85fr] md:gap-12 md:px-8 md:pb-24 md:pt-24">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent"><span className="mr-2 inline-block h-2 w-2 bg-clay" />An open index of UFAZ</div>
            <div className="mt-9 hero-title">
              <div>Things</div>
              <div className="hero-title-blue">Worth</div>
              <div className="hero-title-outline">Knowing.</div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-24 hidden w-fit rotate-[-4deg] border border-line px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted md:block">
              Field notes / 001
            </div>
            <p className="max-w-md font-sans text-lg leading-7 text-muted">
              Resources, notes and hard-won advice collected by students. No feeds to keep up with. Just useful things, in one place.
            </p>
            <SearchLauncher />
            <HeroBrowseLinks tags={tags.length ? tags.map((tag) => tag.name) : ["Python", "PostgreSQL", "Internships"]} />
          </div>
        </div>
      </section>

      <section id="index" className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-16 md:grid-cols-[1.6fr_0.9fr]">
          <HomeFeedSection items={feed} />

          <aside>
            <div className="text-xs uppercase tracking-[0.18em] text-accent">02 / Paths</div>
            <div className="mt-2 border-b-4 border-line pb-3">
              <h2 className="font-accent text-3xl uppercase">Follow a thread</h2>
            </div>
            <div className="mt-6 space-y-5">
              {pathCards.length === 0 ? (
                <div className="border border-line bg-paper p-6">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted">No paths yet</div>
                  <p className="mt-4 font-sans text-sm leading-6 text-muted">
                    Collections appear here once someone groups useful resources into a thread.
                  </p>
                  <Link href="/collections/new" className="mt-5 inline-block border border-line px-3 py-2 font-sans text-sm font-bold hover:bg-clay hover:text-accent">
                    Create a path
                  </Link>
                </div>
              ) : (
                pathCards.map((collection, index) => (
                  <Link
                    key={collection.id}
                    href={collection.href}
                    className={index === 0 ? "block bg-accent p-6 text-paper transition-transform hover:-translate-y-1" : "block bg-clay p-6 text-ink transition-transform hover:-translate-y-1"}
                  >
                    <div className={index === 0 ? "text-xs uppercase tracking-[0.16em] text-line" : "text-xs uppercase tracking-[0.16em] text-accent"}>
                      {String(index + 1).padStart(2, "0")} / Collection
                    </div>
                    <div className="mt-8 font-accent text-2xl uppercase leading-none">{collection.title}</div>
                    <p className={index === 0 ? "mt-4 font-sans text-sm leading-5 text-line" : "mt-4 font-sans text-sm leading-5 text-muted"}>{collection.description}</p>
                    <div className="mt-8 flex justify-between border-t border-current pt-3 text-xs">
                      <span>{collection.count} resources</span>
                      <span>Open ↗</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {pathCards.length > 0 ? (
              <Link href="/collections" className="mt-4 inline-block text-xs text-accent">
                See all paths ›
              </Link>
            ) : null}

            <div className="mt-10">
              <div className="text-xs uppercase tracking-[0.18em] text-accent">03 / People</div>
              <div className="mt-2 border-b-4 border-line pb-3">
                <h2 className="font-accent text-2xl uppercase">Good neighbours</h2>
              </div>
              <div className="mt-5 divide-y divide-line border-y border-line">
                {people.items.slice(0, 3).map((person, index) => (
                  <Link key={person.id} href={`/profile/${person.username}`} className="grid grid-cols-[1.5rem_2rem_1fr_4rem] items-center gap-3 py-3 text-xs transition-colors hover:bg-paper/70">
                    <span>{index + 1}</span>
                    <span className="flex h-7 w-7 items-center justify-center bg-accent font-accent text-[10px] text-paper">
                      {person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </span>
                    <span>
                      <span className="block font-sans font-bold">{person.name}</span>
                      <span className="block text-muted">{person.faculty ?? "UFAZ"}</span>
                    </span>
                    <span className="text-right">{person.reputation_score}</span>
                  </Link>
                ))}
              </div>
              <Link href="/people" className="mt-4 inline-block text-xs text-accent">See everyone ›</Link>
            </div>

            <div className="mt-12 border-t-4 border-line pt-5">
              <div className="text-xs uppercase tracking-[0.18em] text-accent">Have something useful?</div>
              <h2 className="mt-4 font-accent text-2xl uppercase leading-none">Leave the next student a better map.</h2>
              <Link href="/resources/new" className="mt-5 inline-block bg-accent px-5 py-3 font-sans text-sm font-bold text-paper">
                + Submit an entry
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
