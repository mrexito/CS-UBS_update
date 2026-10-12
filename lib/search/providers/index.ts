import type { SearchDocument, SearchProvider } from "../types";
import { getBlogDocuments } from "./blogs";
import { getCaseDocuments } from "./cases";
import { getOrgChartDocuments } from "./orgchart";
import { getRegulatoryComplianceDocuments } from "./regulatoryCompliance";

/**
 * Registrierung aller durchsuchbaren Inhaltsbereiche. Ein weiterer Bereich
 * wird ergänzt, indem hier eine zusätzliche Provider-Funktion eingetragen wird.
 */
export const searchProviders: SearchProvider[] = [
  getCaseDocuments,
  getBlogDocuments,
  getOrgChartDocuments,
  getRegulatoryComplianceDocuments,
];

export async function collectSearchDocuments(locale: string): Promise<SearchDocument[]> {
  const documentSets = await Promise.all(searchProviders.map((provider) => provider(locale)));
  return documentSets.flat();
}
