import { Link } from "@/i18n/navigation";
import { PageSection } from "@/components/layout/PageSection";
import { getTranslations } from "next-intl/server";

const infoLinks = [
    { href: "/blogs", labelKey: "links.blogs" },
    { href: "/organigram", labelKey: "links.organigram" },
    { href: "/about", labelKey: "links.about" },
] as const;

const caseLinks = [
    { href: "/archegos", labelKey: "links.archegos" },
    { href: "/greensill", labelKey: "links.greensill" },
] as const;

export default async function Footer() {
    const year = new Date().getFullYear();
    const t = await getTranslations("footer");

    return (
        <footer className="border-t border-border/85 bg-surface/90 py-10 text-sm text-muted backdrop-blur dark:border-border/55">
            <PageSection className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">{t("badgeLabel")}</p>
                    <p className="text-base text-text">{t("description")}</p>
                    <p className="text-xs">&copy; {year}</p>
                </div>

                <div>
                    <p className="mb-3 text-sm font-semibold text-text">{t("exploreHeading")}</p>
                    <ul className="space-y-2">
                        {infoLinks.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="transition hover:text-primary">
                                    {t(link.labelKey)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="mb-3 text-sm font-semibold text-text">{t("caseLibraryHeading")}</p>
                    <ul className="space-y-2">
                        {caseLinks.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="transition hover:text-primary">
                                    {t(link.labelKey)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-semibold text-text">{t("stayInSyncHeading")}</p>
                    <p>{t("stayInSyncBody")}</p>
                </div>
            </PageSection>
        </footer>
    );
}


