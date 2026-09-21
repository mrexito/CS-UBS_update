/**
 * Wird von Client- und Serverseite genutzt. Bewusst frei von Importen, damit
 * die Suchkomponente im Browser nicht die Suchlogik samt Prisma mitlädt.
 */
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const SEARCH_DEBOUNCE_MS = 250;
