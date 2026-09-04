import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ExternalLink, FlaskConical, ShieldCheck } from "lucide-react";
import { ProfileEditLink } from "@/components/features/profile-edit-link";
import { ResourcePreview } from "@/components/features/resource-preview";
import { getProfileArchive, getPublicProfile } from "@/lib/api";

function looksLikeResearcher(value: string) {
  const normalized = value.toLowerCase();
  return ["research", "phd", "doctoral", "professor", "scientist", "laboratory", " lab"].some((term) => normalized.includes(term));
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, archive] = await Promise.all([
    getPublicProfile(username).catch(() => null),
    getProfileArchive(username).catch(() => ({ resources: [], articles: [], collections: [] }))
  ]);
  if (!profile) notFound();

  const allTags = [...archive.resources, ...archive.articles, ...archive.collections].flatMap((item) => item.tags.map((tag) => tag.name));
  const tags = Array.from(new Set(allTags)).slice(0, 10);
  const totalPublished = archive.resources.length + archive.articles.length + archive.collections.length;
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const researcher = looksLikeResearcher(`${profile.current_role ?? ""} ${profile.bio ?? ""} ${profile.company_or_institution ?? ""} ${profile.degree_level ?? ""}`);
  const verified = profile.is_verified || profile.role === "verified_ufazian" || profile.role === "admin";
  const socials = [
    ["GitHub", profile.github_url],
    ["LinkedIn", profile.linkedin_url],
    ["Telegram", profile.telegram_url ? (profile.telegram_url.startsWith("http") ? profile.telegram_url : `https://t.me/${profile.telegram_url.replace("@", "")}`) : null],
    ["YouTube", profile.youtube_url],
    ["Website", profile.website_url],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <section className="border-b border-line pb-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-clay text-3xl font-semibold text-accent sm:h-32 sm:w-32">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">{profile.name}</h1>
                  {verified ? <ShieldCheck className="h-5 w-5 text-accent" aria-label="Verified UFAZian" /> : null}
                </div>
                <p className="mt-1 text-sm text-muted">@{profile.username}</p>
              </div>
              <ProfileEditLink username={profile.username} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {researcher ? <span className="inline-flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 font-medium text-accent"><FlaskConical className="h-3.5 w-3.5" /> Research</span> : null}
              {profile.current_role ? <span className="rounded-full border border-line bg-paper px-3 py-1.5 font-medium text-ink">{profile.current_role}</span> : null}
              {profile.company_or_institution ? <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-muted">{profile.company_or_institution}</span> : null}
              {profile.faculty ? <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-muted">{profile.faculty}</span> : null}
              {profile.graduation_year ? <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-muted">Class of {profile.graduation_year}</span> : null}
            </div>

            <p className="mt-6 max-w-3xl text-base leading-7 text-muted">{profile.bio ?? "No bio yet."}</p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><strong className="text-ink">{profile.reputation_score}</strong> <span className="text-muted">reputation</span></span>
              <span><strong className="text-ink">{totalPublished}</strong> <span className="text-muted">published</span></span>
              <span><strong className="text-ink">{tags.length}</strong> <span className="text-muted">topics</span></span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-10 py-9 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Contributions</h2>
                <p className="mt-1 text-sm text-muted">Notes, research and resources shared with the community.</p>
              </div>
              <span className="text-xs text-muted">{totalPublished} total</span>
            </div>

            <div className="space-y-3">
              {archive.articles.map((article) => {
                const isResearch = article.tags.some((tag) => tag.name.toLowerCase() === "research");
                return (
                  <article key={article.id} className="rounded-lg border border-line bg-paper p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{isResearch ? "Research note" : "Note"}</span><span>·</span><span>{article.reading_time} min read</span><span>·</span><span>{article.upvotes - article.downvotes} points</span>
                    </div>
                    <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight"><Link href={`/articles/${article.slug}` as Route} className="hover:text-accent">{article.title}</Link></h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{article.excerpt}</p>
                    {article.tags.length ? <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">{article.tags.slice(0, 5).map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div> : null}
                  </article>
                );
              })}

              {archive.resources.map((resource) => (
                <article key={resource.id} className="rounded-lg border border-line bg-paper p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span>Resource</span><span>·</span><span>{resource.upvotes - resource.downvotes} points</span></div>
                  <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight"><Link href={`/resources/${resource.id}` as Route} className="hover:text-accent">{resource.title}</Link></h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{resource.description}</p>
                  <ResourcePreview resource={resource} compact />
                </article>
              ))}

              {archive.articles.length === 0 && archive.resources.length === 0 ? (
                <div className="rounded-lg border border-line bg-surface p-8 text-sm text-muted">Nothing published yet.</div>
              ) : null}
            </div>
          </section>

          {archive.collections.length ? (
            <section>
              <div className="mb-4 border-b border-line pb-3">
                <h2 className="font-serif text-2xl font-semibold">Collections</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {archive.collections.map((collection) => (
                  <Link key={collection.id} href={`/collections/${collection.id}` as Route} className="rounded-lg border border-line bg-paper p-5 hover:border-accent/60 hover:bg-surface">
                    <div className="text-sm font-semibold text-ink">{collection.title}</div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{collection.description}</p>
                    <div className="mt-3 text-xs text-muted">{collection.items.length} resources</div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-7">
          {tags.length ? (
            <section>
              <h2 className="border-b border-line pb-2 font-serif text-lg font-semibold">Topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => <Link key={tag} href={`/resources?q=${encodeURIComponent(tag)}` as Route} className="rounded-full bg-surface px-2.5 py-1.5 text-xs text-accent hover:bg-clay">#{tag}</Link>)}
              </div>
            </section>
          ) : null}

          {socials.length ? (
            <section>
              <h2 className="border-b border-line pb-2 font-serif text-lg font-semibold">Links</h2>
              <div className="mt-2 divide-y divide-line">
                {socials.map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 py-3 text-sm text-ink hover:text-accent">
                    <span>{label}</span><ExternalLink className="h-3.5 w-3.5 text-muted" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="text-xs leading-5 text-muted">Joined UFAZ Hub in {new Date(profile.created_at).getFullYear()}.</section>
        </aside>
      </div>
    </main>
  );
}
