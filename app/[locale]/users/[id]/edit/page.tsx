import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { updateUserAction } from "./actions";
import EditUserForm from "./EditUserClient";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";



type PageProps = { params: Promise<{ locale: string; id: string }> };

export default async function EditUserClient({ params }: PageProps) {
  noStore();
  const { id, locale } = await params;
  const localePrefix = `/${locale}`;

  if (!/^[a-f\d]{24}$/i.test(id)) {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`${localePrefix}/auth/login`);
  }
  const isSelf = session.user.id === id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isSelf && !isAdmin) {
    redirect(`${localePrefix}/users/${id}`);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      bio: true,
    },
  });

  if (!user) {
    notFound();
  }
  const t = await getTranslations("userEdit");
  return (
    <PageSection className="py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col space-y-6">
        <div>
          <p className="eyebrow text-center">{t("eyebrow")}</p>
          <h1 className="heading text-center">{t("profilBearbeiten")}</h1>
        </div>
        <EditUserForm
          user={{
            id: user.id,
            username: user.username ?? "",
            email: user.email ?? "",
            image: user.image ?? "",
            bio: user.bio ?? "",
          }}
          action={updateUserAction.bind(null, locale, user.id)}
        />
      </div>
    </PageSection>
  );
}
