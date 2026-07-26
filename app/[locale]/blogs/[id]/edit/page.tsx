import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import BlogFormClient from "../../BlogFormClient";
import { updateBlogAction } from "../../actions";
import { PageSection } from "@/components/layout/PageSection";
import { getTranslations } from "next-intl/server";
import DeleteBlogButton from "@/components/blog/DeleteBlogButton";

// Server-rendered edit page that preloads existing content into the editor.
type PageProps = { params: Promise<{ locale: string; id: string }> };

export default async function EditBlogPage({ params }: PageProps) {
  noStore();
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  const t = await getTranslations("blogs");

  const blog = await prisma.blogPost.findUnique({ where: { id } });
  if (!blog) notFound();
  if (blog.userId !== session.user.id) redirect(`/${locale}/blogs`);

  return (
    <PageSection className="max-w-4xl space-y-6 py-10">
      <div>
        <p className="eyebrow">{t("editPageEyebrow")}</p>
        <h1 className="heading text-left">{t("editPageTitle")}</h1>
        <div className="mt-3">
          <DeleteBlogButton locale={locale} blogId={blog.id} />
        </div>
      </div>
      <BlogFormClient
        action={updateBlogAction.bind(null, locale, id)}
        initialTitle={blog.title}
        initialContent={blog.content}
        isEdit
      />
    </PageSection>
  );
}
