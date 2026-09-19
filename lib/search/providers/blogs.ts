import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BLOG_LIST_TAG, BLOG_REVALIDATE_SECONDS } from "@/lib/cacheTags";
import { joinText, stripHtml } from "../textUtils";
import type { SearchDocument } from "../types";

const MAX_INDEXED_BLOG_POSTS = 500;

const getBlogSearchRows = unstable_cache(
  async () =>
    prisma.blogPost.findMany({
      select: { id: true, title: true, excerpt: true, content: true, tags: true },
      orderBy: { createdAt: "desc" },
      take: MAX_INDEXED_BLOG_POSTS,
    }),
  ["search:blogs"],
  { tags: [BLOG_LIST_TAG], revalidate: BLOG_REVALIDATE_SECONDS }
);

/**
 * Blogbeiträge existieren jeweils nur in einer Sprache und werden daher
 * unabhängig von der aktiven Sprache durchsucht. Der Inhalt liegt als HTML
 * vor und wird für das Matching in reinen Text umgewandelt.
 */
export async function getBlogDocuments(): Promise<SearchDocument[]> {
  const rows = await getBlogSearchRows();

  return rows.map((row) => {
    const excerpt = row.excerpt ? stripHtml(row.excerpt) : "";
    return {
      id: `blog:${row.id}`,
      type: "blog" as const,
      title: row.title,
      body: joinText([excerpt, stripHtml(row.content)]),
      path: `/blogs/${row.id}`,
      keywords: row.tags,
    };
  });
}
