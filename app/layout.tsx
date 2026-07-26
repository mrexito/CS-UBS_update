import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/[locale]/globals.css";
import { getLocale, getTranslations } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    // =========================
    // SEO SECTION – GLOBAL METADATA DEFAULTS (root)
    // =========================
    title: t("title"),
    description: t("description"),
  };
}

const themeScript = `
  (function () {
    const storageKey = 'theme';
    const className = 'dark';
    const root = document.documentElement;
    try {
      const stored = localStorage.getItem(storageKey);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : (systemPrefersDark ? 'dark' : 'light');
      if (resolved === 'dark') {
        root.classList.add(className);
      } else {
        root.classList.remove(className);
      }
      root.style.colorScheme = resolved;
    } catch (error) {
      // no-op
    }
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text`}>
        {children}
      </body>
    </html>
  );
}


