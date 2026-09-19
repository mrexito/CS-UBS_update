export type SearchResultType = "case" | "blog" | "orgchart";

/** Zeichenbereich [start, end] innerhalb eines Textes, wie ihn Fuse.js liefert. */
export type MatchRange = [number, number];

/**
 * Einheitliches Dokument, auf das jeder Inhaltsbereich abgebildet wird.
 * Neue Inhaltsbereiche brauchen nur einen Provider, der diese Struktur liefert.
 */
export interface SearchDocument {
  id: string;
  type: SearchResultType;
  title: string;
  /** Vollständiger, HTML-freier Text als Grundlage für das Matching. */
  body: string;
  /** Einordnende Zusatzangabe für die Trefferanzeige, z. B. Fallname oder Abteilung. */
  context?: string;
  /** Pfad ohne Locale-Präfix; das Präfix ergänzt next-intl beim Verlinken. */
  path: string;
  /** Sprungmarke innerhalb der Zielseite (Fälle). */
  hash?: string;
  /** Organigramm-Knoten, der auf der Zielseite geöffnet werden soll. */
  nodeId?: string;
  keywords?: string[];
}

export interface SearchResultDTO {
  id: string;
  type: SearchResultType;
  title: string;
  /** Textausschnitt rund um den Treffer. */
  snippet: string;
  context?: string;
  /** Fertiger Pfad inkl. Sprungmarke bzw. Query-Parameter, weiterhin ohne Locale-Präfix. */
  href: string;
  score: number;
  titleMatches?: MatchRange[];
  snippetMatches?: MatchRange[];
}

export interface SearchResponse {
  results: SearchResultDTO[];
}

/**
 * Signatur für alle Inhaltsbereiche. Bereiche ohne Sprachabhängigkeit
 * ignorieren den Parameter schlicht.
 */
export type SearchProvider = (locale: string) => Promise<SearchDocument[]>;
