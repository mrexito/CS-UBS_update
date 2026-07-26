import { auth } from "@/app/[locale]/auth";
import OrganigramClient from "./OrganigramClient";
import { getOrgChartEntries } from "@/lib/orgChart";
import { OrgNodeType } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";
import type { Metadata } from "next";
import { buildAlternates, defaultDescription, defaultOgImage, siteName } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

// =========================
// SEO SECTION – PAGE METADATA (Organigram)
// =========================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [t, navT] = await Promise.all([
    getTranslations({ locale, namespace: "organigram" }),
    getTranslations({ locale, namespace: "navbar" }),
  ]);
  const title = navT("organigram") || t("eyebrow") || "Organigram";
  const description = t("intro") || defaultDescription;
  const alternates = buildAlternates({ locale, path: "/organigram" });

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

export default async function OrganigramPage({ params }: PageProps) {
  const { locale } = await params;
  const [navbarT, pageT] = await Promise.all([
    getTranslations("navbar"),
    getTranslations("organigram"),
  ]);

  const [session, entries] = await Promise.all([auth(), getOrgChartEntries()]);

  const divisionNodes = entries.filter((entry) => entry.nodeType === OrgNodeType.DIVISION);
  const alreadyRegistered = Boolean(session?.user?.id && entries.some((entry) => entry.userId === session.user.id));
  const selfNodeId = session?.user?.id
    ? entries.find((entry) => entry.userId === session.user.id)?.id
    : undefined;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageSection className="space-y-8 py-10">
      <div className="text-center animate-fade-up">
        <p className="eyebrow">{pageT("eyebrow")}</p>
        <h1 className="heading">{navbarT("organigram")}</h1>
        <p className="mx-auto max-w-3xl text-muted">{pageT("intro")}</p>
      </div>

      <div className="animate-fade-up animate-delay-1">
        <OrganigramClient
          initialNodes={entries}
          divisions={divisionNodes.map((division) => ({ id: division.id, name: division.name }))}
          copy={{
            addYourselfHeading: pageT("addYourselfHeading"),
            alreadyRegistered: pageT("alreadyRegistered"),
            departmentLabel: pageT("departmentLabel"),
            departmentPlaceholder: pageT("departmentPlaceholder"),
            functionLabel: pageT("functionLabel"),
            functionPlaceholder: pageT("functionPlaceholder"),
            parentLabel: pageT("parentLabel"),
            submitLabel: pageT("submitLabel"),
            loginPrompt: pageT("loginPrompt"),
            success: pageT("success"),
            error: pageT("error"),
            deleteHeading: pageT("deleteHeading"),
            deleteSelfLabel: pageT("deleteSelfLabel"),
            deleteAdminLabel: pageT("deleteAdminLabel"),
            deleteSelectPlaceholder: pageT("deleteSelectPlaceholder"),
            deleteConfirm: pageT("deleteConfirm"),
            deleteSuccess: pageT("deleteSuccess"),
            deleteError: pageT("deleteError"),
            nameLabel: pageT("nameLabel"),
            photoLabel: pageT("photoLabel"),
            descriptionLabel: pageT("descriptionLabel"),
            descriptionPlaceholder: pageT("descriptionPlaceholder"),
            createTitle: pageT("createTitle"),
            parentNone: pageT("parentNone"),
            saveLabel: pageT("saveLabel"),
            cancelLabel: pageT("cancelLabel"),
            editLabel: pageT("editLabel"),
            viewDetails: pageT("viewDetails"),
            cycleError: pageT("cycleError"),
            uploadLabel: pageT("uploadLabel"),
          }}
          canSelfRegister={Boolean(session?.user)}
          alreadyRegistered={alreadyRegistered}
          locale={locale}
          selfNodeId={selfNodeId}
          isAdmin={isAdmin}
          currentUserId={session?.user?.id}
        />
      </div>
    </PageSection>
  );
}
