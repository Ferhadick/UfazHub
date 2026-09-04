import type { ReactNode } from "react";
import { marked } from "marked";

type MarkdownToken = {
  type: string;
  raw?: string;
  text?: string;
  depth?: number;
  href?: string;
  title?: string | null;
  lang?: string;
  tokens?: MarkdownToken[];
  ordered?: boolean;
  start?: number | string;
  items?: MarkdownListItem[];
  header?: MarkdownTableCell[];
  rows?: MarkdownTableCell[][];
  align?: Array<"left" | "center" | "right" | null>;
};

type MarkdownListItem = {
  text?: string;
  task?: boolean;
  checked?: boolean;
  tokens?: MarkdownToken[];
};

type MarkdownTableCell = {
  text?: string;
  tokens?: MarkdownToken[];
};

function safeHref(value?: string, image = false): string | null {
  if (!value) return null;
  const href = value.trim();
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    if (url.protocol === "http:" || url.protocol === "https:") return href;
    if (!image && url.protocol === "mailto:") return href;
  } catch {
    return null;
  }
  return null;
}

function renderInline(tokens: MarkdownToken[] | undefined, fallback = ""): ReactNode[] {
  if (!tokens?.length) return fallback ? [fallback] : [];

  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`;
    switch (token.type) {
      case "text":
      case "escape":
        return token.tokens?.length ? <span key={key}>{renderInline(token.tokens, token.text)}</span> : token.text ?? "";
      case "strong":
        return <strong key={key}>{renderInline(token.tokens, token.text)}</strong>;
      case "em":
        return <em key={key}>{renderInline(token.tokens, token.text)}</em>;
      case "del":
        return <del key={key}>{renderInline(token.tokens, token.text)}</del>;
      case "codespan":
        return <code key={key}>{token.text ?? ""}</code>;
      case "br":
        return <br key={key} />;
      case "link": {
        const href = safeHref(token.href);
        if (!href) return <span key={key}>{renderInline(token.tokens, token.text)}</span>;
        const external = /^https?:\/\//i.test(href);
        return (
          <a key={key} href={href} title={token.title ?? undefined} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
            {renderInline(token.tokens, token.text || href)}
          </a>
        );
      }
      case "image": {
        const src = safeHref(token.href, true);
        if (!src) return <span key={key}>{token.text ?? "Image"}</span>;
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={key} src={src} alt={token.text ?? ""} title={token.title ?? undefined} loading="lazy" />;
      }
      case "html":
        // Raw HTML is intentionally displayed as text. Markdown is user-authored.
        return <span key={key}>{token.text ?? token.raw ?? ""}</span>;
      default:
        return token.tokens?.length ? <span key={key}>{renderInline(token.tokens, token.text)}</span> : token.text ?? token.raw ?? "";
    }
  });
}

function renderHeading(token: MarkdownToken, key: string) {
  const children = renderInline(token.tokens, token.text);
  switch (token.depth) {
    case 1: return <h1 key={key}>{children}</h1>;
    case 2: return <h2 key={key}>{children}</h2>;
    case 3: return <h3 key={key}>{children}</h3>;
    case 4: return <h4 key={key}>{children}</h4>;
    case 5: return <h5 key={key}>{children}</h5>;
    default: return <h6 key={key}>{children}</h6>;
  }
}

function renderBlocks(tokens: MarkdownToken[] | undefined, prefix = "md"): ReactNode[] {
  if (!tokens?.length) return [];

  return tokens.map((token, index) => {
    const key = `${prefix}-${token.type}-${index}`;
    switch (token.type) {
      case "space":
        return null;
      case "heading":
        return renderHeading(token, key);
      case "paragraph":
        return <p key={key}>{renderInline(token.tokens, token.text)}</p>;
      case "text":
        return token.tokens?.length
          ? <p key={key}>{renderInline(token.tokens, token.text)}</p>
          : <p key={key}>{token.text ?? ""}</p>;
      case "code":
        return (
          <pre key={key} data-language={token.lang || undefined}>
            <code>{token.text ?? ""}</code>
          </pre>
        );
      case "blockquote":
        return <blockquote key={key}>{renderBlocks(token.tokens, `${key}-quote`)}</blockquote>;
      case "hr":
        return <hr key={key} />;
      case "list": {
        const Tag = token.ordered ? "ol" : "ul";
        const start = token.ordered && typeof token.start === "number" && token.start !== 1 ? token.start : undefined;
        return (
          <Tag key={key} start={Tag === "ol" ? start : undefined}>
            {(token.items ?? []).map((item, itemIndex) => (
              <li key={`${key}-item-${itemIndex}`}>
                {item.task ? <input type="checkbox" checked={Boolean(item.checked)} readOnly aria-label={item.checked ? "Completed" : "Not completed"} /> : null}
                <div>{item.tokens?.length ? renderBlocks(item.tokens, `${key}-item-${itemIndex}`) : item.text}</div>
              </li>
            ))}
          </Tag>
        );
      }
      case "table":
        return (
          <div key={key} className="markdown-table-wrap">
            <table>
              <thead>
                <tr>
                  {(token.header ?? []).map((cell, cellIndex) => (
                    <th key={`${key}-head-${cellIndex}`} style={{ textAlign: token.align?.[cellIndex] ?? undefined }}>
                      {renderInline(cell.tokens, cell.text)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(token.rows ?? []).map((row, rowIndex) => (
                  <tr key={`${key}-row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${key}-cell-${rowIndex}-${cellIndex}`} style={{ textAlign: token.align?.[cellIndex] ?? undefined }}>
                        {renderInline(cell.tokens, cell.text)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "html":
        return <p key={key}>{token.text ?? token.raw ?? ""}</p>;
      default:
        return token.tokens?.length
          ? <div key={key}>{renderBlocks(token.tokens, key)}</div>
          : token.text || token.raw ? <p key={key}>{token.text ?? token.raw}</p> : null;
    }
  });
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const tokens = marked.lexer(content, { gfm: true, breaks: false }) as unknown as MarkdownToken[];
  return <div className={`markdown-body ${className}`}>{renderBlocks(tokens)}</div>;
}
