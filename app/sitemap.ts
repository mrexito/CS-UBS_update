import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { baseUrl, safeJoinUrl } from "@/lib/seo";

const staticPaths = ["/", "/about", "/organigram", "/archegos", "/greensill", "/blogs"];

function localizePath(path: string, locale: string): string {
  const normalized = path === "/" ? "" : path;
  if (!normalized) return `/${locale}`;
  return `/${locale}${normalized}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await prisma.blogPost.findMany({
    select: { id: true, updatedAt: true },
  });

  const staticEntries = routing.locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: safeJoinUrl(baseUrl, localizePath(path, locale)),
      lastModified: new Date(),
    }))
  );

  const blogEntries = routing.locales.flatMap((locale) =>
    blogPosts.map((post) => ({
      url: safeJoinUrl(baseUrl, localizePath(`/blogs/${post.id}`, locale)),
      lastModified: post.updatedAt,
    }))
  );

  return [...staticEntries, ...blogEntries];
}
