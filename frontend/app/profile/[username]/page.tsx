import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ExternalLink, Mail, UserRound } from "lucide-react";
import { ProfileEditLink } from "@/components/features/profile-edit-link";
import { getProfileArchive, getPublicProfile } from "@/lib/api";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, archive] = await Promise.all([
    getPublicProfile(username).catch(() => null),
    getProfileArchive(username).catch(() => ({ resources: [], articles: [], collections: [] }))
  ]);
  if (!profile) notFound();

  const allTags = [...archive.resources, ...archive.articles, ...archive.collections].flatMap((item) => item.tags.map((tag) => tag.name));
  const tags = Array.from(new Set(allTags)).slice(0, 8);
  const totalPublished = archive.resources.length + archive.articles.length + archive.collections.length;
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <section className="grid gap-8 border-y border-line py-8 md:grid-cols-[18rem_1fr]">
        <div>
          <div className="flex aspect-square max-w-[14rem] items-center justify-center border-4 border-accent bg-clay font-accent text-6xl text-accent">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="mt-5 grid grid-cols-3 border-y border-line text-center">
            <div className="border-r border-line py-3">
              <div className="font-accent text-2xl">{profile.reputation_score}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Rep</div>
            </div>
            <div className="border-r border-line py-3">
              <div className="font-accent text-2xl">{totalPublished}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Posts</div>
            </div>
            <div className="py-3">
              <div className="font-accent text-2xl">{tags.length}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Tags</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Profile / @{profile.username}</div>
              <h1 className="mt-3 max-w-4xl font-accent text-4xl leading-none break-words md:text-7xl">{profile.name}</h1>
            </div>
            <ProfileEditLink username={profile.username} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="border border-line bg-paper/70 px-3 py-1.5 font-sans">{profile.faculty ?? "UFAZ student"}</span>
            <span className="border border-line bg-paper/70 px-3 py-1.5 font-sans">Joined {new Date(profile.created_at).getFullYear()}</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-accent">About</div>
              <p className="mt-3 max-w-3xl font-sans text-lg leading-8 text-muted">
                {profile.bio ?? "No bio yet. Their contributions below are the best read on what they care about."}
              </p>
              {tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  {tags.map((tag) => (
                    <span key={tag} className="border border-line px-3 py-1.5 text-accent">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className="border-t-2 border-line pt-5 lg:border-t-0 lg:border-l-4 lg:pt-0 lg:pl-5">
              <div className="text-xs uppercase tracking-[0.16em] text-accent">Contact & Socials</div>
              <div className="mt-4 space-y-3 font-sans text-sm">
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 border-b border-line pb-2 text-accent break-all">
                  <Mail className="h-4 w-4 shrink-0" /> {profile.email}
                </a>
                <div className="flex items-center gap-2 border-b border-line pb-2 text-muted">
                  <UserRound className="h-4 w-4 shrink-0" /> @{profile.username}
                </div>
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-line pb-2 text-ink hover:text-accent break-all">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted" /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-line pb-2 text-ink hover:text-accent break-all">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted" /> LinkedIn
                  </a>
                )}
                {profile.telegram_url && (
                  <a href={profile.telegram_url.startsWith("http") ? profile.telegram_url : `https://t.me/${profile.telegram_url.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-line pb-2 text-ink hover:text-accent break-all">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted" /> Telegram
                  </a>
                )}
                {profile.youtube_url && (
                  <a href={profile.youtube_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-line pb-2 text-ink hover:text-accent break-all">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted" /> YouTube
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-line pb-2 text-ink hover:text-accent break-all">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted" /> Website
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-end justify-between border-b-4 border-line pb-3">
            <h2 className="font-accent text-3xl uppercase">Contributions</h2>
            <span className="text-xs text-muted">{totalPublished} published</span>
          </div>
          <div className="divide-y divide-line border-b border-line">
            {archive.articles.map((article, index) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="grid gap-3 py-5 transition-colors hover:bg-paper/70 md:grid-cols-[3rem_1fr_4rem] md:gap-4">
                <div className="flex items-baseline justify-between gap-4 md:block">
                  <span className="font-accent text-xl text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-accent text-xl md:hidden">{article.upvotes - article.downvotes}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted">Article / {article.reading_time} min read</span>
                  <span className="mt-1 block font-accent text-2xl leading-tight break-words">{article.title}</span>
                </div>
                <span className="hidden text-right font-accent text-xl md:block">{article.upvotes - article.downvotes}</span>
              </Link>
            ))}
            {archive.resources.map((resource, index) => (
              <Link key={resource.id} href={`/resources/${resource.id}` as Route} className="grid gap-3 py-5 transition-colors hover:bg-paper/70 md:grid-cols-[3rem_1fr_4rem] md:gap-4">
                <div className="flex items-baseline justify-between gap-4 md:block">
                  <span className="font-accent text-xl text-accent">{String(archive.articles.length + index + 1).padStart(2, "0")}</span>
                  <span className="font-accent text-xl md:hidden">{resource.upvotes - resource.downvotes}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted">{resource.type.replaceAll("_", " ")} / {resource.difficulty}</span>
                  <span className="mt-1 flex items-center gap-2 font-accent text-2xl leading-tight break-words">
                    {resource.title}
                  </span>
                </div>
                <span className="hidden text-right font-accent text-xl md:block">{resource.upvotes - resource.downvotes}</span>
              </Link>
            ))}
            {totalPublished === 0 && (
              <div className="py-10 font-sans text-muted">Nothing published yet. Check back after this student starts sharing.</div>
            )}
          </div>
        </div>

        <aside>
          <div className="border-b-4 border-line pb-3">
            <h2 className="font-accent text-3xl uppercase">Curated paths</h2>
          </div>
          <div className="divide-y divide-line border-b border-line">
            {archive.collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`} className="block py-5 transition-colors hover:bg-paper/70">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">Collection / {collection.items.length} resources</div>
                <div className="mt-2 font-accent text-2xl leading-tight">{collection.title}</div>
                <p className="mt-2 font-sans text-sm leading-6 text-muted">{collection.description}</p>
              </Link>
            ))}
            {archive.collections.length === 0 && (
              <div className="py-10 font-sans text-muted">No collections from this student yet.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
