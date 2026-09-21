import sanitizeHtml from "sanitize-html";

const ENTITY_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Wandelt den HTML-Inhalt der Blogbeiträge in reinen Text um.
 * sanitize-html ist bereits Projektabhängigkeit (siehe lib/sanitizeBlogContent.ts).
 */
export function stripHtml(value: string): string {
  // Ohne Trennzeichen an den Tag-Grenzen würden Absätze zusammenkleben ("WeltZweiter").
  const spacedTags = value.replace(/</g, " <");
  const withoutTags = sanitizeHtml(spacedTags, { allowedTags: [], allowedAttributes: {} });
  const decoded = withoutTags.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    (entity) => ENTITY_REPLACEMENTS[entity] ?? entity
  );
  return normalizeWhitespace(decoded).replace(/\s+([.,;:!?])/g, "$1");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function joinText(parts: Array<string | null | undefined>): string {
  return normalizeWhitespace(parts.filter((part) => Boolean(part && part.trim())).join(" "));
}
