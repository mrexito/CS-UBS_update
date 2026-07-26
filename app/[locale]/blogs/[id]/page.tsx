import { prisma } from "@/lib/prisma";
import { sanitizeBlogContent } from "@/lib/sanitizeBlogContent";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { auth } from "@/app/[locale]/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";
import { ReactionBar } from "@/components/blog/ReactionBar";
import { CommentsSection } from "@/components/blog/CommentsSection";
import { BLOG_LIST_TAG, BLOG_REVALIDATE_SECONDS, blogDetailTag } from "@/lib/cacheTags";
import { getReactionTotalsForPost } from "@/lib/reactionCounts";
import DeleteBlogButton from "@/components/blog/DeleteBlogButton";
import type { Metadata } from "next";
import {
  buildAlternates,
  defaultDescription,
  getOgImageUrl,
  siteName,
  toPlainTextExcerpt,
} from "@/lib/seo";

const getBlogWithComments = (postId: string) =>
  unstable_cache(
    async () =>
      prisma.blogPost.findUnique({
        where: { id: postId },
        include: {
          user: { select: { id: true, username: true, email: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, username: true, email: true } } },
          },
        },
      }),
    ["blog-detail", postId],
    { tags: [BLOG_LIST_TAG, blogDetailTag(postId)], revalidate: BLOG_REVALIDATE_SECONDS }
  )();

const getBlogForMetadata = (postId: string) =>
  unstable_cache(
    async () =>
      prisma.blogPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          title: true,
          excerpt: true,
          content: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { username: true, email: true } },
        },
      }),
    ["blog-meta", postId],
    { tags: [BLOG_LIST_TAG, blogDetailTag(postId)], revalidate: BLOG_REVALIDATE_SECONDS }
  )();

// Detailseite für einen Blogpost
type PageProps = { params: Promise<{ locale: string; id: string }> };

// =========================
// SEO SECTION – PAGE METADATA (Blog Detail)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isValidId = /^[a-f\d]{24}$/i.test(id);
  if (!isValidId) {
    notFound();
  }

  const blog = await getBlogForMetadata(id);
  if (!blog) {
    notFound();
  }

  const sanitized = sanitizeBlogContent(blog.content);
  const description = blog.excerpt?.trim() || toPlainTextExcerpt(sanitized, 180) || defaultDescription;
  const alternates = buildAlternates({ locale, path: `/blogs/${blog.id}` });
  const ogImage = getOgImageUrl({ optionalCloudinaryUrl: blog.images?.[0] });
  const authorName = blog.user?.username || blog.user?.email || "User";

  return {
    title: blog.title,
    description,
    alternates,
    openGraph: {
      type: "article",
      title: blog.title,
      description,
      url: alternates.canonical,
      siteName,
      images: [{ url: ogImage, alt: blog.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description,
      images: [ogImage],
    },
    authors: [{ name: authorName }],
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isValidId = /^[a-f\d]{24}$/i.test(id);
  if (!isValidId) {
    notFound();
  }
  const session = await auth();
  const t = await getTranslations("blogs");

  const blogPromise = getBlogWithComments(id);
  const reactionTotalsPromise = getReactionTotalsForPost(id);

  const userReactionPromise = session?.user?.id
    ? prisma.blogReaction.findUnique({
        where: { postId_userId: { postId: id, userId: session.user.id } },
        select: { type: true },
      })
    : Promise.resolve(null);

  const [blog, userReaction, reactionTotals] = await Promise.all([blogPromise, userReactionPromise, reactionTotalsPromise]);

  if (!blog) {
    notFound();
  }

  const safeContent = sanitizeBlogContent(blog.content);
  const hasBlockTags = /<\/(p|ul|ol|h1|h2|h3|blockquote|pre)>/i.test(safeContent);
  const displayContent = hasBlockTags ? safeContent : safeContent.replace(/\n/g, "<br />");
  const canEdit = session?.user?.id === blog.userId;
  const canModerate = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
  const canDelete = canEdit || canModerate;
  const commentCount = blog.comments.length;
  const description = blog.excerpt?.trim() || toPlainTextExcerpt(safeContent, 180) || defaultDescription;
  const alternates = buildAlternates({ locale, path: `/blogs/${blog.id}` });
  const ogImage = getOgImageUrl({ optionalCloudinaryUrl: blog.images?.[0] });
  const authorName = blog.user?.username || blog.user?.email || "User";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description,
    datePublished: new Date(blog.createdAt).toISOString(),
    dateModified: new Date(blog.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
    },
    mainEntityOfPage: alternates.canonical,
    url: alternates.canonical,
    inLanguage: locale,
    image: ogImage,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };

  const commentItems = blog.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: new Date(comment.createdAt).toISOString(),
    user: comment.user,
  }));

  return (
    <PageSection className="max-w-4xl space-y-10 py-10">
      <article className="surface-card space-y-6 border border-border/70">
        <header className="space-y-2">
          <h1 className="heading text-left">{blog.title}</h1>
          <p className="text-sm text-muted">
            {blog.user ? (
              <Link href={`/${locale}/users/${blog.user.id}`} className="font-medium text-primary hover:text-primary-hover">
                {blog.user.username ?? blog.user.email ?? "Unbekannt"}
              </Link>
            ) : (
              "Unbekannt"
            )}
            {" "}· {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(blog.createdAt))}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span>{t("commentCountLabel", { count: commentCount })}</span>
          </div>
          {canEdit && (
            <Link
              href={`/${locale}/blogs/${blog.id}/edit`}
              className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
            >
              {t("bearbeitenButton")}
            </Link>
          )}
          {canDelete && (
            <DeleteBlogButton locale={locale} blogId={blog.id} redirectPath={`/${locale}/blogs`} />
          )}
          <ReactionBar
            locale={locale}
            postId={blog.id}
            initialLikeCount={reactionTotals.like}
            initialDislikeCount={reactionTotals.dislike}
            initialUserReaction={userReaction?.type ?? null}
            isAuthenticated={!!session?.user}
          />
        </header>

        <div
          className="prose max-w-none text-text prose-headings:text-text prose-strong:text-text prose-a:text-primary dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <CommentsSection
        locale={locale}
        postId={blog.id}
        comments={commentItems}
        isAuthenticated={!!session?.user}
        blogOwnerId={blog.userId}
        currentUserId={session?.user?.id}
        currentUserRole={session?.user?.role as "USER" | "ADMIN" | "EDITOR" | undefined}
      />
    </PageSection>
  );
}
