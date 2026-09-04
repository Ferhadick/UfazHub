import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, FileText, FlaskConical, Link2, Users } from "lucide-react";
import { listArticles, listPeople, listResources } from "@/lib/api";
import type { ArticleRead, ResourceRead } from "@/types/api";
import { ResourcePreview } from "@/components/features/resource-preview";

export const metadata = { title: "Research — UFAZ Hub" };

const researchKinds = [
  { Icon: FileText, label: "Papers & theses" },
  { Icon: FlaskConical, label: "Projects & lab work" },
  { Icon: Link2, label: "Datasets & sources" },
  { Icon: Users, label: "Researchers" },
];

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

async function researchContent() {
  const terms = ["research", "paper", "thesis", "project"];
  const [articleResults, resourceResults] = await Promise.all([
    Promise.all(terms.map((term) => listArticles(12, term).catch(() => ({ items: [] as ArticleRead[], total: 0, limit: 12, offset: 0 })))),
    Promise.all(terms.map((term) => listResources(12, term).catch(() => ({ items: [] as ResourceRead[], total: 0, limit: 12, offset: 0 })))),
  ]);
  const articles = uniqueById(articleResults.flatMap((result) => result.items)).slice(0, 6);
  const resources = uniqueById(resourceResults.flatMap((result) => result.items)).slice(0, 6);
  return { articles, resources };
}


export default async function ResearchPage() {
  const [{ articles, resources }, researchers] = await Promise.all([
    researchContent(),
    listPeople(6, undefined, { group: "researchers", sort: "featured" }).catch(() => ({ items: [], total: 0, limit: 6, offset: 0 }))
  ]);

  const hasResearch = articles.length > 0 || resources.length > 0;

  return (
    <main>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold text-accent">Research & discovery</p>
              <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Research should be easy to find, read and build on.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">
                Share papers, theses, student projects, datasets, lab notes and research links in one place. UFAZ Hub keeps the work readable and connects it to the people behind it.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={"/submit?research=1" as Route} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  Share research <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={"/people" as Route} className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface">
                  Find collaborators <Users className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {researchKinds.map(({ Icon, label }) => (
                <div key={label} className="rounded-lg border border-line bg-paper p-4">
                  <Icon className="h-5 w-5 text-accent" />
                  <div className="mt-3 text-sm font-semibold text-ink">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-12">
            <section>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">Recent research & projects</h2>
                  <p className="mt-1 text-sm text-muted">Research-tagged notes, papers, project writeups and source material.</p>
                </div>
              </div>

              {!hasResearch ? (
                <div className="rounded-lg border border-dashed border-line bg-surface p-8 sm:p-10">
                  <h3 className="font-serif text-2xl font-semibold">Start the research archive.</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Publish a project summary in Markdown, attach the paper or slides, add the source link, and mark it as research. The page will populate automatically.</p>
                  <Link href={"/submit?research=1" as Route} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Share the first research post <ArrowRight className="h-4 w-4" /></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <article key={article.id} className="rounded-lg border border-line bg-paper p-5 sm:p-6">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">Research note</div>
                      <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight"><Link href={`/articles/${article.slug}` as Route} className="hover:text-accent">{article.title}</Link></h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{article.excerpt}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Link href={`/profile/${article.author.username}` as Route} className="font-medium text-ink hover:text-accent">{article.author.name}</Link>
                        <span>·</span><span>{article.reading_time} min read</span>
                        {article.tags.slice(0, 4).map((tag) => <span key={tag.id}>#{tag.name}</span>)}
                      </div>
                    </article>
                  ))}
                  {resources.map((resource) => (
                    <article key={resource.id} className="rounded-lg border border-line bg-paper p-5 sm:p-6">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">Research resource</div>
                      <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight"><Link href={`/resources/${resource.id}` as Route} className="hover:text-accent">{resource.title}</Link></h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{resource.description}</p>
                      <ResourcePreview resource={resource} compact />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <h2 className="font-serif text-lg font-semibold">Researchers</h2>
                <Link href={"/people" as Route} className="text-xs font-medium text-accent hover:underline">All people</Link>
              </div>
              <div className="divide-y divide-line">
                {researchers.items.length === 0 ? <p className="py-4 text-sm leading-6 text-muted">Add research interests or a research role to your profile to appear here.</p> : null}
                {researchers.items.map((person) => (
                  <Link key={person.id} href={`/profile/${person.username}` as Route} className="block py-4 first:pt-2">
                    <div className="text-sm font-semibold text-ink hover:text-accent">{person.name}</div>
                    <div className="mt-1 text-xs leading-5 text-muted">{person.current_role || person.faculty || "Research contributor"}</div>
                    {person.company_or_institution ? <div className="mt-0.5 text-xs text-muted">{person.company_or_institution}</div> : null}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-serif text-lg font-semibold">What belongs here?</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                <li>Published papers and preprints</li>
                <li>Theses and capstone projects</li>
                <li>Research posters and presentations</li>
                <li>Datasets, code and reproducibility links</li>
                <li>Lab notes and project summaries</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
