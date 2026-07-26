import {
  GithubSignInButton,
  GoogleSignInButton,
} from "@/components/authButtons";
import LoginFormClient from "./LoginFormClient";
import { loginAction } from "./actions";
import { auth } from "@/app/[locale]/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/PageSection";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ auth?: string; callbackUrl?: string }> };

const LoginPage = async ({ params, searchParams }: PageProps) => {
  const { locale } = await params;
  const { auth: authReason } = await searchParams;
  const localePrefix = `/${locale}`;
  const session = await auth();
  const t = await getTranslations("login");
  if (session?.user) {
    redirect(localePrefix);
  }

  return (
    <PageSection className="py-12">
      <div className="surface-card grid gap-10 p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <p className="eyebrow">{t("secureAreaEyebrow")}</p>
          <h1 className="text-3xl font-semibold text-text">{t("MeldeDichAn")}</h1>
          <p className="text-muted">
            {t("secureAreaLead")}
          </p>
          {authReason === "required" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t("loginRequired")}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="stat-pill">{t("ssoReady")}</span>
            <span className="stat-pill">{t("darkModeAware")}</span>
            <span className="stat-pill">{t("credentialsReady")}</span>
            <span className="stat-pill">{t("sessionPersists")}</span>
          </div>
        </div>

        <div className="surface-card space-y-5 p-6">
          <LoginFormClient action={loginAction.bind(null, locale)} />
          <p className="text-center text-sm font-semibold text-muted">{t("oder")}</p>
          <div className="flex flex-col gap-3">
            <GoogleSignInButton />
            <GithubSignInButton />
          </div>
        </div>
      </div>
    </PageSection>
  );
};

export default LoginPage;
