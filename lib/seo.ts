/*
=========================
SEO LOCATIONS MAP
- lib/seo.ts: central config/helpers
- app/[locale]/layout.tsx: global metadata + Organization/WebSite JSON-LD
- app/sitemap.ts: sitemap generation
- app/robots.ts: robots rules
- app/[locale]/blogs/[id]/page.tsx: dynamic metadata + BlogPosting JSON-LD
=========================
*/

// =========================
// SEO SECTION – CENTRAL CONFIG (lib/seo.ts)
// =========================

import { routing } from "@/i18n/routing";

export const siteName = "cs_ubs_fusion";
export const defaultTitle = "cs_ubs_fusion";
export const defaultDescription = "A curated knowledge base with blogs, cases, and organizational insights.";
export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const defaultOgImage = "https://res.cloudinary.com/dymwgac6m/image/upload/v1765210908/296fe121-5dfa-43f4-98b5-db50019738a7_bxzq63.jpg";

export function safeJoinUrl(base: string, path: string): string {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getCanonicalUrl({ locale, path }: { locale: string; path: string }): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const localePath = locale ? `/${locale}${normalizedPath}` : normalizedPath;
  return safeJoinUrl(baseUrl, localePath);
}

export function buildAlternates({
  locale,
  path,
  locales = routing.locales,
}: {
  locale: string;
  path: string;
  locales?: readonly string[];
}) {
  const languages: Record<string, string> = {};
  locales.forEach((loc) => {
    languages[loc] = getCanonicalUrl({ locale: loc, path });
  });
  return {
    canonical: getCanonicalUrl({ locale, path }),
    languages,
  };
}

export function getOgImageUrl({ optionalCloudinaryUrl, fallback = defaultOgImage }: { optionalCloudinaryUrl?: string | null; fallback?: string }) {
  if (optionalCloudinaryUrl) {
    if (optionalCloudinaryUrl.startsWith("http")) return optionalCloudinaryUrl;
    return safeJoinUrl(baseUrl, optionalCloudinaryUrl);
  }
  return fallback;
}

export function toPlainTextExcerpt(htmlOrText: string, maxLen = 160): string {
  const text = htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}
