import { Fragment, type ReactNode } from "react";
import type { MatchRange } from "@/lib/search/types";

type HighlightedTextProps = {
  text: string;
  ranges?: MatchRange[];
};

/** Fuse.js liefert inklusive Bereiche [start, end]. */
export function HighlightedText({ text, ranges }: HighlightedTextProps) {
  if (!ranges?.length) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (start < cursor || start >= text.length) continue;
    if (start > cursor) parts.push(<Fragment key={`t${cursor}`}>{text.slice(cursor, start)}</Fragment>);
    const stop = Math.min(end + 1, text.length);
    parts.push(
      <mark
        key={`m${start}`}
        className="rounded-sm bg-[hsl(var(--primary)/0.3)] px-0.5 text-[hsl(var(--text))]"
      >
        {text.slice(start, stop)}
      </mark>
    );
    cursor = stop;
  }

  if (cursor < text.length) parts.push(<Fragment key="rest">{text.slice(cursor)}</Fragment>);

  return <>{parts}</>;
}
