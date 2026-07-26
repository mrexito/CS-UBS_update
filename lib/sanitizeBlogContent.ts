import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "a",
  "img",
];

const allowedAttributes = {
  a: ["href"],
  img: ["src", "alt", "width", "height", "style"],
};

const allowedClasses = {
  "*": ["ql-align-center", "ql-align-right", "ql-align-justify", "ql-align-left"],
};

const allowedStyles = {
  img: {
    width: [/^\d+(%|px)$/],
    height: [/^\d+(%|px)$/],
  },
};

export function sanitizeBlogContent(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags,
    allowedAttributes,
    allowedClasses,
    allowedStyles,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
  }).trim();
}
