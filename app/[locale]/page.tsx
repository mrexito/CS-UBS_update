import CldImage from "@/components/cloudinary";
import { PageSection } from "@/components/layout/PageSection";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";

export const revalidate = 3600;

// =========================
// SEO SECTION – PAGE METADATA (Home)
// =========================
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("header");
  const description = t("heroDescription") || defaultDescription;
  const alternates = buildAlternates({ locale, path: "" });
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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });

  const heroBulletKeys = ["heroBullets.archive", "heroBullets.project", "heroBullets.secure"] as const;
  const overviewPillKeys = ["overviewPills.cases", "overviewPills.blogs", "overviewPills.organigram"] as const;
  const highlightCards = [
    {
      href: "/archegos",
      titleKey: "highlight.caseArchive.title",
      copyKey: "highlight.caseArchive.copy",
    },
    {
      href: "/organigram",
      titleKey: "highlight.orgParticipation.title",
      copyKey: "highlight.orgParticipation.copy",
    },
    {
      href: "/blogs",
      titleKey: "highlight.sharedExperience.title",
      copyKey: "highlight.sharedExperience.copy",
    },
  ] as const;

  return (
    <div className="space-y-16 pb-16">
      <PageSection className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="heading animate-fade-up text-left">{t("header")}</h1>
          <p className="animate-fade-up animate-delay-1 text-lg text-muted">{t("heroDescription")}</p>
          <ul className="animate-fade-up animate-delay-2 space-y-2 text-sm text-muted">
            {heroBulletKeys.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          <div className="animate-fade-up animate-delay-3 flex flex-wrap gap-4">
            <Link href="/blogs">
              <Button size="lg">{t("heroPrimaryCta")}</Button>
            </Link>
            <Link href="/organigram">
              <Button variant="secondary" size="lg">
                {t("heroSecondaryCta")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="surface-card animate-fade-up animate-delay-2 overflow-hidden border border-border/70 bg-surface/60 p-0">
          <CldImage className="h-full w-full object-cover" alt={t("heroImageAlt")} />
        </div>
      </PageSection>

      <PageSection className="animate-fade-up">
        <div className="surface-card border border-border/70">
          <h2 className="text-2xl font-semibold text-text">{t("overviewHeading")}</h2>
          <p className="mt-4 text-sm text-muted">{t("overviewBody")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {overviewPillKeys.map((pillKey) => (
              <div key={pillKey} className="rounded-2xl border border-border/70 bg-surface-2 px-4 py-3 text-sm font-medium text-text">
                {t(pillKey)}
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="animate-fade-up animate-delay-1">
        <div className="grid gap-6 md:grid-cols-3">
          {highlightCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="surface-card flex h-full flex-col justify-between border border-border/70 transition hover:-translate-y-1"
            >
              <div className="space-y-3">
                <p className="text-sm font-semibold text-primary">{t(card.titleKey)}</p>
                <p className="text-sm text-muted">{t(card.copyKey)}</p>
              </div>
              <span className="mt-6 text-sm font-semibold text-text">{t("highlight.open")}</span>
            </Link>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
