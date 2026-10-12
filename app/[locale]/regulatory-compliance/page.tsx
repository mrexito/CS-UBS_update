import { PageSection } from "@/components/layout/PageSection";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { RC_BASE_PATH, RC_TOPICS } from "@/lib/regulatoryCompliance";
import { buildAlternates, defaultOgImage, siteName } from "@/lib/seo";

export const revalidate = 3600;

type PageProps = { params: Promise<{ locale: string }> };

// =========================
// SEO SECTION – PAGE METADATA (Regulatory Compliance Übersicht)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  const title = t("overview.title");
  const description = t("overview.lead");
  const alternates = buildAlternates({ locale, path: RC_BASE_PATH });

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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function RegulatoryComplianceOverviewPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  const cardClasses =
    "group flex flex-col gap-3 rounded-3xl border border-border/70 bg-surface/70 p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl dark:border-border/40";

  return (
    <PageSection className="bg-[hsl(var(--bg))] py-12 text-text lg:py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="space-y-5 text-center animate-fade-up">
          <p className="eyebrow text-primary">{t("overview.eyebrow")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("overview.title")}</h1>
          <p className="mx-auto max-w-2xl text-base text-muted sm:text-lg">{t("overview.lead")}</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up animate-delay-1">
          {RC_TOPICS.map((topic) => (
            <Link key={topic.slug} href={`${RC_BASE_PATH}/${topic.slug}`} className={cardClasses}>
              <div className="flex items-start justify-between">
                <span className={`mt-1 h-2 w-2 rounded-full ${topic.hasContent ? "bg-primary" : "bg-muted/40"}`} aria-hidden />
                <ArrowIcon
                  className={`h-4 w-4 transition ${topic.hasContent ? "text-primary" : "text-muted group-hover:text-primary"}`}
                />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-text">{t(`topics.${topic.key}.title`)}</h2>
              <p className="text-sm text-muted">{t(`topics.${topic.key}.description`)}</p>
              <p className="mt-auto pt-2 text-xs text-muted">{t(`topics.${topic.key}.meta`)}</p>
            </Link>
          ))}

          <div className="flex flex-col gap-3 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight text-primary">{t("overview.storyline.title")}</h2>
            <p className="text-sm leading-relaxed text-white">{t("overview.storyline.text")}</p>
          </div>
        </div>

        <nav
          aria-label={t("overview.flowLabel")}
          className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center animate-fade-up animate-delay-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{t("overview.flowLabel")}</p>
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {RC_TOPICS.map((topic, index) => (
              <li key={topic.slug} className="flex items-center gap-3">
                {index > 0 && (
                  <span className="text-muted" aria-hidden>
                    →
                  </span>
                )}
                <Link
                  href={`${RC_BASE_PATH}/${topic.slug}`}
                  className={`font-medium transition hover:text-primary ${topic.hasContent ? "text-primary" : "text-text"}`}
                >
                  {t(`topics.${topic.key}.short`)}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </PageSection>
  );
}
