import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import { collectSearchDocuments } from "./providers";
import type { MatchRange, SearchDocument, SearchResultDTO } from "./types";

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;

const RESULT_LIMIT = 8;
/** Verhindert, dass ein einzelner Bereich (z. B. die vielen Fall-Abschnitte) die Liste belegt. */
const MAX_RESULTS_PER_TYPE = 4;
const SNIPPET_LENGTH = 160;

const FUSE_OPTIONS: IFuseOptions<SearchDocument> = {
  includeScore: true,
  includeMatches: true,
  // Ohne ignoreLocation würden Treffer weit hinten im Fliesstext stark abgewertet.
  ignoreLocation: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.5 },
    { name: "context", weight: 0.15 },
    { name: "keywords", weight: 0.15 },
    { name: "body", weight: 0.2 },
  ],
};

export async function searchContent(query: string, locale: string): Promise<SearchResultDTO[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const documents = await collectSearchDocuments(locale);
  const fuse = new Fuse(documents, FUSE_OPTIONS);
  const matches = fuse.search(trimmed);

  return pickBalancedResults(matches).map(toResultDTO);
}

/**
 * Erst je Bereich begrenzt auffüllen, danach verbleibende Plätze nach Relevanz
 * vergeben. So bleiben andere Bereiche sichtbar, ohne Plätze zu verschenken,
 * wenn nur ein Bereich Treffer liefert.
 */
function pickBalancedResults(results: FuseResult<SearchDocument>[]): FuseResult<SearchDocument>[] {
  const perType = new Map<string, number>();
  const selected: FuseResult<SearchDocument>[] = [];
  const remainder: FuseResult<SearchDocument>[] = [];

  for (const result of results) {
    const count = perType.get(result.item.type) ?? 0;
    if (selected.length < RESULT_LIMIT && count < MAX_RESULTS_PER_TYPE) {
      perType.set(result.item.type, count + 1);
      selected.push(result);
    } else {
      remainder.push(result);
    }
  }

  for (const result of remainder) {
    if (selected.length >= RESULT_LIMIT) break;
    selected.push(result);
  }

  return selected.slice(0, RESULT_LIMIT);
}

function toResultDTO(result: FuseResult<SearchDocument>): SearchResultDTO {
  const { item } = result;
  const titleMatches = rangesForKey(result, "title");
  const { snippet, snippetMatches } = buildSnippet(item.body, rangesForKey(result, "body"));

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    snippet,
    context: item.context,
    href: buildHref(item),
    // Fuse-Score: 0 = exakter Treffer, 1 = sehr unscharf.
    score: result.score ?? 1,
    titleMatches: titleMatches.length ? titleMatches : undefined,
    snippetMatches: snippetMatches.length ? snippetMatches : undefined,
  };
}

function rangesForKey(result: FuseResult<SearchDocument>, key: string): MatchRange[] {
  const match = result.matches?.find((entry) => entry.key === key);
  return match ? match.indices.map(([start, end]) => [start, end] as MatchRange) : [];
}

function buildHref(document: SearchDocument): string {
  if (document.nodeId) return `${document.path}?node=${encodeURIComponent(document.nodeId)}`;
  if (document.hash) return `${document.path}#${document.hash}`;
  return document.path;
}

/**
 * Kürzt den Fliesstext auf einen Ausschnitt rund um den ersten Treffer und
 * rechnet die Trefferpositionen auf diesen Ausschnitt um.
 */
function buildSnippet(
  body: string,
  ranges: MatchRange[]
): { snippet: string; snippetMatches: MatchRange[] } {
  if (body.length <= SNIPPET_LENGTH) {
    return { snippet: body, snippetMatches: shiftRanges(ranges, 0, body.length, 0) };
  }

  const focus = ranges.length ? ranges[0][0] : 0;
  let start = Math.max(0, focus - Math.floor(SNIPPET_LENGTH / 3));
  let end = Math.min(body.length, start + SNIPPET_LENGTH);
  if (end === body.length) start = Math.max(0, end - SNIPPET_LENGTH);

  // Nicht mitten im Wort abschneiden.
  if (start > 0) {
    const nextSpace = body.indexOf(" ", start);
    if (nextSpace !== -1 && nextSpace < start + 24) start = nextSpace + 1;
  }
  if (end < body.length) {
    const previousSpace = body.lastIndexOf(" ", end);
    if (previousSpace > start) end = previousSpace;
  }

  const prefix = start > 0 ? "… " : "";
  const suffix = end < body.length ? " …" : "";

  return {
    snippet: `${prefix}${body.slice(start, end)}${suffix}`,
    snippetMatches: shiftRanges(ranges, start, end, prefix.length),
  };
}

/** Fuse liefert inklusive Bereiche [start, end]; `end` ist hier exklusiv. */
function shiftRanges(
  ranges: MatchRange[],
  start: number,
  end: number,
  offset: number
): MatchRange[] {
  const shifted: MatchRange[] = [];
  for (const [rangeStart, rangeEnd] of ranges) {
    if (rangeEnd < start || rangeStart >= end) continue;
    shifted.push([
      Math.max(rangeStart, start) - start + offset,
      Math.min(rangeEnd, end - 1) - start + offset,
    ]);
  }
  return shifted;
}
