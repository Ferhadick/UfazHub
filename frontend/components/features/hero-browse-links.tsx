"use client";

type BrowseEventDetail = {
  tag: string;
};

export function HeroBrowseLinks({ tags }: { tags: string[] }) {
  function chooseTag(tag: string) {
    window.dispatchEvent(new CustomEvent<BrowseEventDetail>("ufaz-home-filter", { detail: { tag } }));
    document.getElementById("index")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-5 flex flex-wrap gap-4 text-xs">
      <span className="text-ink">Browse by:</span>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => chooseTag(tag)}
          className="border-b border-accent text-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-y-0"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
