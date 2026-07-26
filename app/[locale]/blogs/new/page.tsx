import { auth } from "@/app/[locale]/auth";
import { redirect } from "next/navigation";
import BlogFormClient from "../BlogFormClient";
import { createBlogAction } from "../actions";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";
  


type PageProps = { params: Promise<{ locale: string }> };

export default async function NewBlogPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("blogs");
  if (!session?.user) redirect(`/${locale}/auth/login`);

  return (
    <PageSection className="max-w-4xl space-y-6 py-10">
      <div>
        <p className="eyebrow text-center">{t("newPageEyebrow")}</p>
        <h1 className="heading text-center">{t("newBlogButton")}</h1>
        <p className="text-muted text-center">{t("newPageLead")}</p>
      </div>
      <BlogFormClient action={createBlogAction.bind(null, locale)} />
    </PageSection>
  );
}