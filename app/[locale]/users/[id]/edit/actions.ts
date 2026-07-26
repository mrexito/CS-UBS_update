"use server";

import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { getTranslations } from "next-intl/server";

export type UpdateUserState = {
  error?: string | null;
  success?: string | null;
  redirectTo?: string | null;
};

const MAX_BIO_LENGTH = 500;

export async function updateUserAction(
  locale: string,
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  const localePrefix = locale ? `/${locale}` : "";
  const session = await auth();
  const t = await getTranslations("userEdit");
  if (!session?.user?.id) {
    return { error: t("nichtAngemeldet") };
  }
  const isSelf = session.user.id === userId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isSelf && !isAdmin) {
    return { error: t("keineBerechtigung") };
  }

  const username = String(formData.get("username") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;
  const passwordRaw = String(formData.get("password") ?? "").trim();
  const password = passwordRaw ? await hashPassword(passwordRaw) : null;

  if (bio && bio.length > MAX_BIO_LENGTH) {
    return { error: t("bioZuLang", { limit: MAX_BIO_LENGTH }) };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        bio,
        image,
        ...(password ? { password } : {}),
      },
    });

    revalidatePath(`${localePrefix}/users/${userId}`);
    revalidatePath(`${localePrefix}/users`);
    return { success: t("profilAktualisiert"), redirectTo: `${localePrefix}/users/${userId}` };
  } catch (err: unknown) {
    // Prisma unique constraints etc.
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return { error: t("usernameOderEmailBereitsVergeben") };
    }
    return { error: t("aktualisierungFehlgeschlagen") };
  }
}
