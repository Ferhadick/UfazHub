"use client";

type BrowseEventDetail = { tag: string };

export function HeroBrowseLinks({ tags }: { tags: string[] }) {
  function chooseTag(tag: string) {
    window.dispatchEvent(new CustomEvent<BrowseEventDetail>("ufaz-home-filter", { detail: { tag } }));
    document.getElementById("index")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-muted">Browse:</span>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => chooseTag(tag)}
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
