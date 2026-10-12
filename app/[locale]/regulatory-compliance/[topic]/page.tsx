import { PageSection } from "@/components/layout/PageSection";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RC_BASE_PATH, RC_TOPICS } from "@/lib/regulatoryCompliance";
import { buildAlternates, defaultOgImage, siteName } from "@/lib/seo";

export const revalidate = 3600;

// Unbekannte Slugs liefern 404. Themen mit eigener Seite (capital-ratios) sind statisch
// vorrangig und erreichen diese Route nie.
export const dynamicParams = false;

type PageProps = { params: Promise<{ locale: string; topic: string }> };

export function generateStaticParams() {
  return RC_TOPICS.filter((topic) => !topic.hasContent).map((topic) => ({ topic: topic.slug }));
}

/** Liefert nur Platzhalter-Themen. Unbekannte oder inhaltliche Slugs ergeben undefined. */
function findPlaceholderTopic(slug: string) {
  return RC_TOPICS.find((topic) => topic.slug === slug && !topic.hasContent);
}

// =========================
// SEO SECTION – PAGE METADATA (Regulatory Compliance Platzhalter)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, topic: slug } = await params;
  const topic = findPlaceholderTopic(slug);
  if (!topic) return {};

  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  const title = t(`topics.${topic.key}.title`);
  const description = t(`topics.${topic.key}.description`);
  const alternates = buildAlternates({ locale, path: `${RC_BASE_PATH}/${topic.slug}` });

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

export default async function RegulatoryCompliancePlaceholderPage({ params }: PageProps) {
  const { locale, topic: slug } = await params;
  const topic = findPlaceholderTopic(slug);
  if (!topic) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  return (
    <PageSection className="bg-[hsl(var(--bg))] py-12 text-text lg:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <Link
          href={RC_BASE_PATH}
          className="w-fit text-sm font-semibold text-muted transition hover:text-primary animate-fade-up"
        >
          ‹ {t("placeholder.back")}
        </Link>

        <header className="space-y-5 animate-fade-up animate-delay-1">
          <p className="eyebrow text-primary">{t("overview.eyebrow")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t(`topics.${topic.key}.title`)}</h1>
          <p className="text-base text-muted sm:text-lg">{t(`topics.${topic.key}.description`)}</p>
        </header>

        <div className="animate-fade-up animate-delay-2 rounded-3xl border border-border/70 bg-surface/70 p-6 text-center shadow-lg dark:border-border/40">
          <p className="text-base text-muted">{t("placeholder.comingSoon")}</p>
        </div>
      </div>
    </PageSection>
  );
}
