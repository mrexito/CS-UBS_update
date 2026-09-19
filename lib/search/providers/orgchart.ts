import { getOrgChartEntries } from "@/lib/orgChart";
import { joinText } from "../textUtils";
import type { SearchDocument } from "../types";

/**
 * Organigramm-Einträge sind sprachneutral. Sie haben keine eigene Route –
 * Treffer verlinken auf /organigram und öffnen den Knoten über ?node=<id>.
 */
export async function getOrgChartDocuments(): Promise<SearchDocument[]> {
  const entries = await getOrgChartEntries();

  return entries.map((entry) => ({
    id: `orgchart:${entry.id}`,
    type: "orgchart" as const,
    title: entry.name,
    context: joinText([entry.roleTitle, entry.department]) || undefined,
    body: joinText([entry.roleTitle, entry.department, entry.description]),
    path: "/organigram",
    nodeId: entry.id,
  }));
}
