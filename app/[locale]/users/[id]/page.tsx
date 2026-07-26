import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/[locale]/auth";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";
import { Button } from "@/components/ui/button";
import { ReactionsDisplay } from "@/components/blog/ReactionsDisplay";
import { BLOG_REVALIDATE_SECONDS, userBlogsTag } from "@/lib/cacheTags";
import { getReactionCountMap } from "@/lib/reactionCounts";
import DeleteBlogButton from "@/components/blog/DeleteBlogButton";
import DeleteUserButton from "@/components/users/DeleteUserButton";

const getUserBlogList = (userId: string) =>
  unstable_cache(
    async () => {
      const blogs = await prisma.blogPost.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      });

      const countMap = await getReactionCountMap(blogs.map((blog) => blog.id));

      return blogs.map((blog) => {
        const totals = countMap.get(blog.id) ?? { like: 0, dislike: 0 };
        return {
          id: blog.id,
          title: blog.title,
          createdAt: blog.createdAt,
          likeCount: totals.like,
          dislikeCount: totals.dislike,
          commentCount: blog._count.comments,
        };
      });
    },
    ["user-blogs", userId],
    { tags: [userBlogsTag(userId)], revalidate: BLOG_REVALIDATE_SECONDS }
  )();

type PageProps = { params: Promise<{ locale: string; id: string }> };

export default async function Page({ params }: PageProps) {
  const { id, locale } = await params;
  const localePrefix = `/${locale}`;
  const t = await getTranslations("user");
  const d = await getTranslations("blogs");
  // Validierung für MongoDB ObjectId (24 Hex-Zeichen)
  if (!/^[a-f\d]{24}$/i.test(id)) {
    notFound();
  }

  const [session, user, blogs] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    }),
    getUserBlogList(id),
  ]);

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === user.id;
  const canSeePrivate = isOwnProfile || session?.user?.role === "ADMIN";
  const canModerateBlogs = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
  const canDeleteAccount = isOwnProfile || session?.user?.role === "ADMIN";

  return (
    <PageSection className="space-y-8 py-10">
      <div className="surface-card flex flex-col gap-6 border border-border/70 md:flex-row">
        {user?.image && (
          <div className="relative h-28 w-28 flex-shrink-0">
            <Image src={user.image} alt={t("profileImageAlt")} fill className="rounded-full object-cover" sizes="112px" />
          </div>
        )}
        <div className="space-y-3">
          <div>
            <p className="eyebrow">{t("profil")}</p>
            <h2 className="text-3xl font-semibold text-text">{user.username || t("fallbackName")}</h2>
            {user.username && <p className="text-muted">@{user.username}</p>}
          </div>
          <p className="text-text">
            {user.bio && user.bio.trim().length > 0 ? user.bio : canSeePrivate ? t("keineBioHinterlegt") : ""}
          </p>
          <div className="text-sm text-muted">
            {t("mitgliedSeit")} {new Date(user.createdAt).toLocaleDateString()}
          </div>
          {canSeePrivate && user.email && <p className="text-sm text-text">{t("email")}: {user.email}</p>}
          <div className="flex flex-wrap gap-3">
            {canSeePrivate && (
              <Link href={`${localePrefix}/users/${user.id}/edit`}>
                <Button size="sm">{t("profilAktualisieren")}</Button>
              </Link>
            )}
            {canDeleteAccount && (
              <DeleteUserButton locale={locale} userId={user.id} size="sm" />
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-text">{d("sectionHeading")}</h3>
          {isOwnProfile && blogs.length > 0 && (
            <Link href={`${localePrefix}/blogs/new`} className="text-sm font-semibold text-primary hover:text-primary-hover">
              {d("newBlogLink")}
            </Link>
          )}
        </div>
        {blogs.length === 0 ? (
          <p className="text-sm text-muted">{d("noBlogs")}</p>
        ) : (
          <div className="grid gap-4">
            {blogs.map((blog) => (
              <article key={blog.id} className="surface-card border border-border/70">
                  <header className="mb-2 space-y-1">
                    <h4 className="text-lg font-semibold text-text">{blog.title || d("ohneTitel")}</h4>
                    <p className="text-xs text-muted">
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(blog.createdAt))}
                    </p>
                  </header>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link
                      href={`${localePrefix}/blogs/${blog.id}`}
                      className="inline-flex items-center font-semibold text-primary hover:text-primary-hover"
                    >
                      {d("toBlogButton")}
                    </Link>
                    {isOwnProfile && (
                      <Link
                        href={`${localePrefix}/blogs/${blog.id}/edit`}
                        className="inline-flex items-center text-muted hover:text-text"
                      >
                        {d("bearbeitenButton")}
                      </Link>
                    )}
                    {(isOwnProfile || canModerateBlogs) && (
                      <DeleteBlogButton locale={locale} blogId={blog.id} size="sm" variant="ghost" />
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <ReactionsDisplay
                      likeCount={blog.likeCount}
                      dislikeCount={blog.dislikeCount}
                      likeLabel={d("like")}
                      dislikeLabel={d("dislike")}
                      locale={locale}
                      size="sm"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{d("commentCountLabel", { count: blog.commentCount })}</span>
                      <Link
                        href={`${localePrefix}/blogs/${blog.id}#comments`}
                        className="inline-flex items-center font-semibold text-primary hover:text-primary-hover"
                      >
                        {d("viewCommentsButton")}
                      </Link>
                    </div>
                  </div>
                </article>
            ))}
          </div>
        )}
      </section>
    </PageSection>
  );
}
