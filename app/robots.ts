import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { baseUrl } from "@/lib/seo";

const disallowBase = [
  "/auth",
  "/auth/login",
  "/auth/register",
  "/users",
  "/users/*",
  "/blogs/new",
  "/blogs/*/edit",
  "/api",
];

function expandDisallow(): string[] {
  const localized = routing.locales.flatMap((locale) =>
    disallowBase.map((path) => `/${locale}${path}`)
  );
  return Array.from(new Set([...disallowBase, ...localized]));
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: expandDisallow(),
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
