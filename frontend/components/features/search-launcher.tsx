"use client";

export function SearchLauncher() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ufaz-open-search"))}
      className="mt-9 w-full max-w-md border-2 border-line bg-paper p-4 text-left shadow-[6px_6px_0_var(--color-accent)]"
    >
      <span className="block text-[10px] uppercase tracking-[0.18em] text-accent">Search the archive</span>
      <span className="mt-3 flex items-center justify-between font-sans text-base text-muted">
        <span>What are you looking for?</span>
        <span className="text-xs">Ctrl<br />K</span>
      </span>
    </button>
  );
}
