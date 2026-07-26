import { PageSection } from "@/components/layout/PageSection";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

// =========================
// SEO SECTION – PAGE METADATA (About)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("hero.title");
  const description = t("hero.lead") || defaultDescription;
  const alternates = buildAlternates({ locale, path: "/about" });
  const canonical = alternates.canonical;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonical,
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

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });

  const frameworkItems = t.raw("framework.items") as string[];
  const cards = t.raw("cards") as Array<{ title: string; body: string }>;
  const goalItems = t.raw("goals.items") as string[];

  return (
    <div className="space-y-16 pb-16">
      <PageSection className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="eyebrow animate-fade-up">{t("eyebrow")}</p>
          <h1 className="heading animate-fade-up text-left">{t("hero.title")}</h1>
          <p className="animate-fade-up animate-delay-1 text-lg text-muted">{t("hero.lead")}</p>
          <p className="animate-fade-up animate-delay-2 text-sm text-muted">{t("hero.supporting")}</p>
        </div>
        <div className="surface-card animate-fade-up animate-delay-2 h-full border border-border/70">
          <p className="text-sm font-semibold text-primary">{t("framework.title")}</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {frameworkItems.map((item, index) => (
              <li key={`about-framework-${index}`} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      <PageSection className="animate-fade-up">
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card, index) => (
            <div key={`about-card-${index}`} className="surface-card h-full border border-border/70">
              <p className="text-sm font-semibold text-primary">{card.title}</p>
              <p className="mt-3 text-sm text-muted">{card.body}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection className="animate-fade-up animate-delay-1">
        <div className="surface-card border border-border/70">
          <h2 className="text-2xl font-semibold text-text">{t("goals.title")}</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {goalItems.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      <PageSection className="animate-fade-up animate-delay-2">
        <div className="surface-card border border-border/70">
          <h2 className="text-2xl font-semibold text-text">{t("participation.title")}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <p className="text-sm text-muted">{t("participation.body")}</p>
            <div className="rounded-2xl border border-border/70 bg-[hsl(var(--bg))] p-4 text-sm text-muted dark:bg-surface-2">
              <p className="font-semibold text-text">{t("participation.access.title")}</p>
              <p className="mt-2">{t("participation.access.body")}</p>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
