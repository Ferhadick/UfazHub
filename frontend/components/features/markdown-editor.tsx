"use client";

import { useRef } from "react";
import { Bold, Code2, Heading2, Link2, List } from "lucide-react";
import { MarkdownContent } from "@/components/features/markdown-content";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  id?: string;
  compact?: boolean;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write in Markdown...",
  minHeightClass = "min-h-[300px]",
  id,
  compact = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function replaceSelection(before: string, after = "", fallback = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  }

  function prefixLine(prefix: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const hasText = value.slice(lineStart).trim().length > 0;
    const next = `${value.slice(0, lineStart)}${prefix}${hasText ? "" : fallback}${value.slice(lineStart)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = lineStart + prefix.length + (hasText ? 0 : fallback.length);
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const toolbarButton = "inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/15">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-2 py-1.5">
        <div className="flex items-center gap-0.5" aria-label="Markdown formatting">
          <button type="button" className={toolbarButton} onClick={() => prefixLine("## ", "Heading")} title="Heading 2">
            <Heading2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Heading</span>
          </button>
          <button type="button" className={toolbarButton} onClick={() => replaceSelection("**", "**", "bold text")} title="Bold">
            <Bold className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Bold</span>
          </button>
          <button type="button" className={toolbarButton} onClick={() => prefixLine("- ", "List item")} title="Bulleted list">
            <List className="h-3.5 w-3.5" /> <span className="hidden sm:inline">List</span>
          </button>
          <button type="button" className={toolbarButton} onClick={() => replaceSelection("[", "](https://)", "link text")} title="Link">
            <Link2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Link</span>
          </button>
          <button type="button" className={toolbarButton} onClick={() => replaceSelection("`", "`", "code")} title="Inline code">
            <Code2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Code</span>
          </button>
        </div>
        <span className="px-2 text-[11px] text-muted">Markdown</span>
      </div>

      <div className={`grid ${compact ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
        <div className={compact ? "" : "lg:border-r lg:border-line"}>
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`${minHeightClass} w-full resize-y border-0 bg-paper px-4 py-4 text-[15px] leading-7 text-ink outline-none placeholder:text-muted/65 focus:ring-0`}
          />
        </div>
        <div className={`${compact ? "border-t" : "border-t lg:border-t-0"} border-line bg-surface px-4 py-4`}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Preview</div>
          {value.trim() ? (
            <MarkdownContent content={value} className="text-sm" />
          ) : (
            <p className="text-sm leading-6 text-muted">Your formatted text appears here as you type.</p>
          )}
        </div>
      </div>
    </div>
  );
}
