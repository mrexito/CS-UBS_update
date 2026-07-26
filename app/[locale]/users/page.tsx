import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { PageSection } from "@/components/layout/PageSection";
import { getTranslations } from "next-intl/server";
import { auth } from "@/app/[locale]/auth";
import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

const Page = async ({ params }: PageProps) => {
  noStore();
  const { locale } = await params;
  const localePrefix = `/${locale}`;
  const t = await getTranslations("user");
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

    if (!session) {
    const callbackUrl = encodeURIComponent(`${localePrefix}/users`);
    redirect(`${localePrefix}/auth/login?auth=required&callbackUrl=${callbackUrl}`);
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, bio: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageSection className="space-y-6 py-10">
      <div className="text-center space-y-2">
        <p className="eyebrow inline-block">{t("directoryEyebrow")}</p>
        <h1 className="heading text-center">{t("directoryTitle")}</h1>
        <p className="text-muted mx-auto max-w-3xl">{t("directoryLead")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {users.map((u) => {
          const displayName = u.username ?? u.email ?? t("fallbackName");
          const memberSince = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(u.createdAt));
          const bio = u.bio && u.bio.trim().length > 0 ? u.bio : t("keineBioHinterlegt");

          return (
            <Link key={u.id} href={`${localePrefix}/users/${u.id}`} className="surface-card border border-border/70">
              <p className="text-lg font-semibold text-text">{displayName}</p>
              <p className="text-sm text-muted">{bio}</p>
              <p className="text-xs text-muted">{t("mitgliedSeit")} {memberSince}</p>
              {isAdmin && u.email && <p className="text-xs text-text">{u.email}</p>}
            </Link>
          );
        })}
      </div>
    </PageSection>
  );
};

export default Page;
