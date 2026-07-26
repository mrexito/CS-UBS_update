import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/navbar";
import Providers from "@/app/[locale]/providers";
import Footer from "@/components/footer";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/app/[locale]/auth";
import { baseUrl, buildAlternates, defaultDescription, defaultOgImage, defaultTitle, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const pageTitle = t("title") || defaultTitle;
  const description = t("description") || defaultDescription;
  const alternates = buildAlternates({ locale, path: "" });

  return {
    // =========================
    // SEO SECTION – GLOBAL METADATA DEFAULTS
    // =========================
    metadataBase: new URL(baseUrl),
    title: {
      default: pageTitle,
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    openGraph: {
      type: "website",
      siteName,
      title: pageTitle,
      description,
      url: alternates.canonical,
      images: [{ url: defaultOgImage, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}


export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  await setRequestLocale(locale);
  const messages = await getMessages();
  const session = await auth();

  const orgJsonLd = {
    // =========================
    // SEO SECTION – STRUCTURED DATA (JSON-LD)
    // Organization/WebSite
    // =========================
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: baseUrl,
    logo: defaultOgImage,
  };

  return (
    <Providers session={session}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="app-gradient relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_55%)]" />
          <div className="relative z-10 flex min-h-screen flex-col gap-6">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            {/* =========================
                SEO SECTION – STRUCTURED DATA (JSON-LD)
               ========================= */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
            />
          </div>
        </div>
      </NextIntlClientProvider>
    </Providers>
  );
}
