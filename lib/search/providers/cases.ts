import { joinText } from "../textUtils";
import type { SearchDocument } from "../types";

/**
 * Einzige Quelle der Fallstudien-Slugs für die Suche. Die Slugs entsprechen
 * sowohl dem Schlüssel unter "cases" in den Sprachdateien als auch der Route.
 */
export const CASE_SLUGS = ["archegos", "greensill"] as const;

type CaseSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type CaseContent = {
  title: string;
  lead: string;
  keyTakeaways?: string[];
  sections?: CaseSection[];
};

const documentsByLocale = new Map<string, SearchDocument[]>();

async function loadCases(locale: string): Promise<Record<string, CaseContent | undefined>> {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (messages.cases ?? {}) as Record<string, CaseContent | undefined>;
}

/**
 * Fallstudien liegen als übersetzte Inhalte in messages/{locale}.json.
 * Pro Fall entsteht ein Übersichts-Dokument sowie je Abschnitt ein eigenes
 * Dokument, damit Treffer direkt auf den passenden Abschnitt verlinken können.
 * Der Inhalt ist pro Deployment statisch und wird deshalb je Sprache zwischengespeichert.
 */
export async function getCaseDocuments(locale: string): Promise<SearchDocument[]> {
  const cached = documentsByLocale.get(locale);
  if (cached) return cached;

  const cases = await loadCases(locale);
  const documents: SearchDocument[] = [];

  for (const slug of CASE_SLUGS) {
    const content = cases[slug];
    if (!content) continue;

    const path = `/${slug}`;

    documents.push({
      id: `case:${slug}`,
      type: "case",
      title: content.title,
      body: joinText([content.lead, ...(content.keyTakeaways ?? [])]),
      path,
    });

    for (const section of content.sections ?? []) {
      documents.push({
        id: `case:${slug}:${section.id}`,
        type: "case",
        title: section.title,
        context: content.title,
        body: joinText(section.paragraphs),
        path,
        hash: section.id,
      });
    }
  }

  documentsByLocale.set(locale, documents);
  return documents;
}
