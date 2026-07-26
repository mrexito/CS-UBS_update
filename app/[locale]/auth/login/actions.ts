"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/app/[locale]/auth";
import { revalidatePath } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

export type LoginResult = { error?: string | null; redirectTo?: string };

export async function loginAction(
  locale: string,
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const localePrefix = locale ? `/${locale}` : "/";
  const emailOrUsername = String(formData.get("emailOrUsername") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  await setRequestLocale(locale);
  const t = await getTranslations("login");

  if (!emailOrUsername || !password) {
    return { error: "Füllen Sie alle Felder aus" };
  }

  try {
    const res = await signIn("credentials", {
      emailOrUsername,
      password,
      redirect: false,
      callbackUrl: localePrefix,
    });

    if (res && typeof res === "object") {
      if ("error" in res && res.error) {
        return { error: res.error || `${t("falscheInformation")}` };
      }
      if ("ok" in res && res.ok) {
        const target = ("url" in res && res.url) ? res.url : localePrefix;
        revalidatePath(target);
        return { redirectTo: target };
      }
    }

    revalidatePath(localePrefix);
    return { redirectTo: localePrefix };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { error: `${t("falscheInformation")}` };
      }
      return { error: `${t("problemeBeimAnmelden")}` };
    }
    return { error: `${t("etwasIstSchief")}` };
  }
}
