import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import CreateBlogButton from "@/components/CreateBlogButton";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";
import { sanitizeBlogContent } from "@/lib/sanitizeBlogContent";
import { ReactionsDisplay } from "@/components/blog/ReactionsDisplay";
import { BLOG_LIST_TAG, BLOG_REVALIDATE_SECONDS } from "@/lib/cacheTags";
import { getReactionCountMap } from "@/lib/reactionCounts";
import DeleteBlogButton from "@/components/blog/DeleteBlogButton";
import type { Metadata } from "next";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";

const MAX_EXCERPT_LENGTH = 280;

const buildExcerptFromHtml = (html: string): string => {
  const sanitized = sanitizeBlogContent(html);
  const text = sanitized
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_EXCERPT_LENGTH ? `${text.slice(0, MAX_EXCERPT_LENGTH)}…` : text;
};

const getBlogCards = unstable_cache(
  async () => {
    const blogs = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
        userId: true,
        user: { select: { id: true, username: true, email: true } },
        _count: { select: { comments: true } },
      },
    });

    const missingExcerptIds = blogs.filter((blog) => !blog.excerpt).map((blog) => blog.id);
    let fallbackExcerpts = new Map<string, string>();
    if (missingExcerptIds.length > 0) {
      const fallbackContent = await prisma.blogPost.findMany({
        where: { id: { in: missingExcerptIds } },
        select: { id: true, content: true },
      });
      fallbackExcerpts = new Map(
        fallbackContent.map((item) => [item.id, buildExcerptFromHtml(item.content)])
      );
    }

    const countMap = await getReactionCountMap(blogs.map((blog) => blog.id));

    return blogs.map((blog) => {
      const totals = countMap.get(blog.id) ?? { like: 0, dislike: 0 };
      const preview = blog.excerpt || fallbackExcerpts.get(blog.id) || "";
      return {
        id: blog.id,
        title: blog.title,
        preview,
        createdAt: blog.createdAt,
        userId: blog.userId,
        likeCount: totals.like,
        dislikeCount: totals.dislike,
        commentCount: blog._count.comments,
        user: blog.user,
      };
    });
  },
  ["blogs:list"],
  { tags: [BLOG_LIST_TAG], revalidate: BLOG_REVALIDATE_SECONDS }
);

type PageProps = { params: Promise<{ locale: string }> };

// =========================
// SEO SECTION – PAGE METADATA (Blog List)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blogs" });

  const title = t("feedTitle") || "Blogs";
  const description = t("feedLead") || defaultDescription;
  const alternates = buildAlternates({ locale, path: "/blogs" });

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName,
      images: [{ url: defaultOgImage, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function BlogsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("blogs");
  const blogs = await getBlogCards();

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <PageSection className="space-y-8 py-10">
      <div className="text-center">
        <p className="eyebrow">{t("feedEyebrow")}</p>
        <h1 className="heading">{t("feedTitle")}</h1>
        <p className="mx-auto max-w-2xl text-muted">
          {t("feedLead")}
        </p>
      </div>

      <div className="flex justify-center">
        <CreateBlogButton isLoggedIn={!!session?.user} />
      </div>

      {blogs.length === 0 ? (
        <p className="text-center text-muted">{t("noBlogs")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {blogs.map((blog) => {
            const canEdit = session?.user?.id === blog.userId;
            const canModerate = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
            const canDelete = canEdit || canModerate;
            const formattedDate = dateFormatter.format(new Date(blog.createdAt));
            const preview = blog.preview;
            return (
              <article
                key={blog.id}
                className="surface-card flex min-h-[340px] flex-col border border-border/70 p-5 shadow-sm"
              >
                <header className="mb-3 space-y-2">
                  <h2 className="text-xl font-semibold text-text">{blog.title}</h2>
                  <p className="text-xs text-muted">
                    {blog.user?.username ?? blog.user?.email ?? t("unknownAuthor")} · {formattedDate}
                  </p>
                </header>
                {preview && <p className="line-clamp-3 text-sm text-muted">{preview}</p>}

                <div className="mt-auto space-y-4 border-t border-border/50 pt-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/${locale}/blogs/${blog.id}`}
                      className="inline-flex items-center font-semibold text-primary transition hover:text-primary-hover"
                    >
                      {t("toBlogButton")} →
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/${locale}/blogs/${blog.id}/edit`}
                        className="inline-flex items-center text-muted transition hover:text-text"
                      >
                        {t("editBlogButton")}
                      </Link>
                    )}
                    {canDelete && (
                      <DeleteBlogButton locale={locale} blogId={blog.id} size="sm" variant="ghost" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <ReactionsDisplay
                      likeCount={blog.likeCount}
                      dislikeCount={blog.dislikeCount}
                      likeLabel={t("like")}
                      dislikeLabel={t("dislike")}
                      locale={locale}
                      size="sm"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{t("commentCountLabel", { count: blog.commentCount })}</span>
                      <Link
                        href={`/${locale}/blogs/${blog.id}#comments`}
                        className="inline-flex items-center font-semibold text-primary hover:text-primary-hover"
                      >
                        {t("viewCommentsButton")}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
