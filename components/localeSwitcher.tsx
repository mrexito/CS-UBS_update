'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';


export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
      router.refresh();
    }
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-text shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      aria-label={t("languageSwitcherAriaLabel")}
    >
      <option value="de">{t("locales.de")}</option>
      <option value="en">{t("locales.en")}</option>
      <option value="fr">{t("locales.fr")}</option>
      <option value="it">{t("locales.it")}</option>
      <option value="es">{t("locales.es")}</option>
    </select>
  );
}