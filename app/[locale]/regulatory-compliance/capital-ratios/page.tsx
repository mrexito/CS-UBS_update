import { PageSection } from "@/components/layout/PageSection";
import { RatioChart } from "@/components/regulatoryCompliance/RatioChart";
import { RatioTable } from "@/components/regulatoryCompliance/RatioTable";
import { Link } from "@/i18n/navigation";
import { RC_BASE_PATH, RC_CAPITAL_RATIOS_ANCHORS, RC_TOPICS } from "@/lib/regulatoryCompliance";
import { LEVERAGE_CAPITAL_RATIOS, RWA_CAPITAL_RATIOS } from "@/lib/regulatoryCompliance/capitalRatios";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

const PATH = `${RC_BASE_PATH}/capital-ratios`;

// =========================
// SEO SECTION – PAGE METADATA (Kapitalquoten, Kapitel 7)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  const title = t("capitalRatios.title") || "Kapitalquoten";
  const description = t("capitalRatios.lead") || defaultDescription;
  const alternates = buildAlternates({ locale, path: PATH });

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

export default async function CapitalRatiosPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "regulatoryCompliance" });

  const keyTakeaways = t.raw("capitalRatios.keyTakeaways") as string[];
  const referenceLines = t.raw("capitalRatios.reference.lines") as string[];
  const columns = {
    quarter: t("capitalRatios.sections.rwa.columns.quarter"),
    cet1: t("capitalRatios.sections.rwa.columns.cet1"),
    target: t("capitalRatios.sections.rwa.columns.target"),
    goingConcern: t("capitalRatios.sections.rwa.columns.goingConcern"),
    goneConcern: t("capitalRatios.sections.rwa.columns.goneConcern"),
    tlac: t("capitalRatios.sections.rwa.columns.tlac"),
  };
  const leverageColumns = {
    quarter: t("capitalRatios.sections.leverage.columns.quarter"),
    cet1: t("capitalRatios.sections.leverage.columns.cet1"),
    target: t("capitalRatios.sections.leverage.columns.target"),
    goingConcern: t("capitalRatios.sections.leverage.columns.goingConcern"),
    goneConcern: t("capitalRatios.sections.leverage.columns.goneConcern"),
    tlac: t("capitalRatios.sections.leverage.columns.tlac"),
  };

  // Naechstes Thema laut RC_TOPICS (Reihenfolge ist der Vertrag aus Phase 1).
  const currentIndex = RC_TOPICS.findIndex((topic) => topic.key === "capitalRatios");
  const nextTopic = currentIndex >= 0 ? RC_TOPICS[currentIndex + 1] : undefined;

  return (
    <PageSection className="bg-[hsl(var(--bg))] py-12 text-text lg:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <Link href={RC_BASE_PATH} className="self-start text-sm font-medium text-primary transition hover:text-primary-hover">
          ‹ {t("placeholder.back")}
        </Link>

        <header className="space-y-5 animate-fade-up">
          <p className="eyebrow text-primary">{t("capitalRatios.eyebrow")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("capitalRatios.title")}</h1>
          <p className="text-base text-muted sm:text-lg">{t("capitalRatios.lead")}</p>
        </header>

        <div className="animate-fade-up animate-delay-1 rounded-3xl border border-border/70 bg-surface/70 p-6 text-sm text-muted shadow-lg dark:border-border/40">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("capitalRatios.labels.takeaways")}</p>
          <ul className="mt-3 space-y-2 text-base text-text">
            {keyTakeaways.map((item, index) => (
              <li key={`capital-takeaway-${index}`} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <article className="animate-fade-up animate-delay-2 space-y-14">
          <section id={RC_CAPITAL_RATIOS_ANCHORS.rwa} className="scroll-mt-24 space-y-6 border-b border-border/60 pb-14">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">
                {t("capitalRatios.sections.rwa.title")}
              </h2>
              <p className="text-base text-muted">{t("capitalRatios.sections.rwa.intro")}</p>
            </div>
            <RatioChart
              data={RWA_CAPITAL_RATIOS}
              actualKey="cet1"
              targetKey="target"
              actualLabel={t("capitalRatios.sections.rwa.actualLabel")}
              targetLabel={t("capitalRatios.labels.target")}
              title={t("capitalRatios.sections.rwa.chartTitle")}
              color="primary"
            />
            <RatioTable
              caption={t("capitalRatios.sections.rwa.tableCaption")}
              columns={columns}
              rows={RWA_CAPITAL_RATIOS}
            />
          </section>

          <section id={RC_CAPITAL_RATIOS_ANCHORS.leverage} className="scroll-mt-24 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">
                {t("capitalRatios.sections.leverage.title")}
              </h2>
              <p className="text-base text-muted">{t("capitalRatios.sections.leverage.intro")}</p>
            </div>
            <RatioChart
              data={LEVERAGE_CAPITAL_RATIOS}
              actualKey="cet1"
              targetKey="target"
              actualLabel={t("capitalRatios.sections.leverage.actualLabel")}
              targetLabel={t("capitalRatios.labels.target")}
              title={t("capitalRatios.sections.leverage.chartTitle")}
              color="success"
            />
            <RatioTable
              caption={t("capitalRatios.sections.leverage.tableCaption")}
              columns={leverageColumns}
              rows={LEVERAGE_CAPITAL_RATIOS}
            />
          </section>
        </article>

        <section className="rounded-3xl border border-border/70 bg-surface/70 p-6 text-sm text-muted shadow-lg dark:border-border/40 animate-fade-up animate-delay-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("capitalRatios.labels.reference")}</p>
          <div className="mt-4 space-y-1 text-base text-text">
            <p className="font-semibold">{t("capitalRatios.reference.title")}</p>
            {referenceLines.map((line, index) => (
              <p key={`capital-ref-${index}`}>{line}</p>
            ))}
          </div>
        </section>

        {nextTopic ? (
          <div className="flex justify-center pt-6 animate-fade-up animate-delay-4">
            <Link
              href={`${RC_BASE_PATH}/${nextTopic.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
            >
              {t("capitalRatios.labels.next")} →
            </Link>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}
