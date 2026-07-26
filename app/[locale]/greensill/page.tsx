import { PageSection } from "@/components/layout/PageSection";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";

type CaseSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type TimelineEntry = {
  year: string;
  title: string;
  description: string;
};

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

// =========================
// SEO SECTION – PAGE METADATA (Greensill Case)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cases" });
  const baseKey = "greensill";

  const title = t(`${baseKey}.title`) || "Greensill Case";
  const description = t(`${baseKey}.lead`) || defaultDescription;
  const alternates = buildAlternates({ locale, path: "/greensill" });

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

export default async function GreensillPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "cases" });
  const baseKey = "greensill";

  const keyTakeaways = t.raw(`${baseKey}.keyTakeaways`) as string[];
  const sections = t.raw(`${baseKey}.sections`) as CaseSection[];
  const timeline = t.raw(`${baseKey}.timelineEntries`) as TimelineEntry[];
  const referenceLines = t.raw(`${baseKey}.reference.lines`) as string[];

  return (
    <PageSection className="bg-[hsl(var(--bg))] py-12 text-text lg:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="space-y-5 text-center animate-fade-up">
          <p className="eyebrow text-primary">{t(`${baseKey}.eyebrow`)}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t(`${baseKey}.title`)}</h1>
          <p className="text-base text-muted sm:text-lg">{t(`${baseKey}.lead`)}</p>
        </header>

        <div className="animate-fade-up animate-delay-1 rounded-3xl border border-border/70 bg-surface/70 p-6 text-sm text-muted shadow-lg dark:border-border/40">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t(`${baseKey}.labels.takeaways`)}</p>
          <ul className="mt-3 space-y-2 text-base text-text">
            {keyTakeaways.map((item, index) => (
              <li key={`${baseKey}-takeaway-${index}`} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <nav
          aria-label={t(`${baseKey}.labels.toc`)}
          className="animate-fade-up animate-delay-2 rounded-3xl border border-border/70 bg-surface/70 p-6 shadow-lg dark:border-border/40"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t(`${baseKey}.labels.toc`)}</p>
          <ol className="mt-4 space-y-2 text-sm text-text">
            {sections.map((section, index) => (
              <li key={section.id} className="flex items-start gap-2">
                <span className="text-muted">{String(index + 1).padStart(2, "0")}</span>
                <a href={`#${section.id}`} className="text-base font-medium text-text transition hover:text-primary">
                  {section.title}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <span className="text-muted">{String(sections.length + 1).padStart(2, "0")}</span>
              <a href="#zeitstrahl" className="text-base font-medium text-text transition hover:text-primary">
                {t(`${baseKey}.labels.timeline`)}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted">{String(sections.length + 2).padStart(2, "0")}</span>
              <a href="#referenz" className="text-base font-medium text-text transition hover:text-primary">
                {t(`${baseKey}.labels.reference`)}
              </a>
            </li>
          </ol>
        </nav>

        <article className="prose prose-lg prose-headings:font-semibold prose-headings:text-text prose-p:text-text/90 prose-p:text-justify prose-a:text-primary dark:prose-invert animate-fade-up animate-delay-3">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 space-y-4 border-b border-border/60 pb-10 mb-10 last:border-none last:pb-0 last:mb-0"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.id}-${index}`}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>

        <section id="zeitstrahl" className="space-y-6 border-t border-border/60 pt-10 animate-fade-up animate-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t(`${baseKey}.labels.timeline`)}</p>
              <h2 className="text-2xl font-semibold">{t(`${baseKey}.timeline.heading`)}</h2>
            </div>
            <span className="text-sm text-muted">{t(`${baseKey}.timeline.range`)}</span>
          </div>
          <ol className="space-y-4 border-l border-border/60 pl-6 text-sm text-muted">
            {timeline.map((entry) => (
              <li key={entry.title} className="relative">
                <span className="absolute -left-3 top-1 h-2 w-2 rounded-full border border-primary bg-surface" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{entry.year}</p>
                <p className="text-base font-semibold text-text">{entry.title}</p>
                <p>{entry.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="referenz"
          className="rounded-3xl border border-border/70 bg-surface/70 p-6 text-sm text-muted shadow-lg dark:border-border/40 animate-fade-up animate-delay-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t(`${baseKey}.labels.reference`)}</p>
          <div className="mt-4 space-y-1 text-base text-text">
            <p className="font-semibold">{t(`${baseKey}.reference.title`)}</p>
            {referenceLines.map((line, index) => (
              <p key={`${baseKey}-ref-${index}`}>{line}</p>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-6 animate-fade-up animate-delay-5">
          <Link
            href="/archegos"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            {t(`${baseKey}.cta`)}
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
