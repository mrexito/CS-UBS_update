import { RC_BASE_PATH, RC_CAPITAL_RATIOS_ANCHORS, RC_TOPICS } from "../../regulatoryCompliance";
import { joinText } from "../textUtils";
import type { SearchDocument } from "../types";

type TopicMessages = {
  title: string;
  description: string;
  meta?: string;
};

type SectionMessages = {
  title: string;
  intro?: string;
  chartTitle?: string;
};

type CapitalRatiosMessages = {
  lead?: string;
  keyTakeaways?: string[];
  sections?: Record<string, SectionMessages | undefined>;
};

type RegulatoryComplianceContent = {
  overview?: {
    title: string;
    lead: string;
    storyline?: { title: string; text: string };
  };
  topics?: Record<string, TopicMessages | undefined>;
  capitalRatios?: CapitalRatiosMessages;
};

const CAPITAL_RATIOS_SECTIONS = [
  { key: "rwa", hash: RC_CAPITAL_RATIOS_ANCHORS.rwa },
  { key: "leverage", hash: RC_CAPITAL_RATIOS_ANCHORS.leverage },
] as const;

const documentsByLocale = new Map<string, SearchDocument[]>();

async function loadContent(locale: string): Promise<RegulatoryComplianceContent> {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (messages.regulatoryCompliance ?? {}) as RegulatoryComplianceContent;
}

/**
 * Inhalte des Themenbereichs Regulatory Compliance liegen als übersetzte Texte
 * in messages/{locale}.json (Namespace "regulatoryCompliance"). Es entsteht ein
 * Dokument für die Übersicht, je ein Dokument pro Thema und für die Kapitel-7-
 * Abschnitte (7.1 / 7.2) mit Sprungmarke. Der Inhalt ist pro Deployment statisch
 * und wird deshalb je Sprache zwischengespeichert.
 */
export async function getRegulatoryComplianceDocuments(
  locale: string
): Promise<SearchDocument[]> {
  const cached = documentsByLocale.get(locale);
  if (cached) return cached;

  const content = await loadContent(locale);
  const documents: SearchDocument[] = [];

  if (content.overview) {
    documents.push({
      id: "regulatoryCompliance:overview",
      type: "regulatoryCompliance",
      title: content.overview.title,
      body: joinText([
        content.overview.lead,
        content.overview.storyline?.title,
        content.overview.storyline?.text,
      ]),
      path: RC_BASE_PATH,
    });
  }

  for (const topic of RC_TOPICS) {
    const message = content.topics?.[topic.key];
    if (!message) continue;

    const path = `${RC_BASE_PATH}/${topic.slug}`;
    const isCapitalRatios = topic.key === "capitalRatios";
    const capital = content.capitalRatios;

    documents.push({
      id: `regulatoryCompliance:${topic.slug}`,
      type: "regulatoryCompliance",
      title: message.title,
      body: joinText([
        message.description,
        message.meta,
        ...(isCapitalRatios ? [capital?.lead, ...(capital?.keyTakeaways ?? [])] : []),
      ]),
      path,
    });

    if (!isCapitalRatios) continue;

    for (const section of CAPITAL_RATIOS_SECTIONS) {
      const sectionMessage = capital?.sections?.[section.key];
      if (!sectionMessage) continue;

      documents.push({
        id: `regulatoryCompliance:${topic.slug}:${section.hash}`,
        type: "regulatoryCompliance",
        title: sectionMessage.title,
        context: message.title,
        body: joinText([sectionMessage.intro, sectionMessage.chartTitle]),
        path,
        hash: section.hash,
      });
    }
  }

  documentsByLocale.set(locale, documents);
  return documents;
}
