"use client";

import { Theme, useTheme } from "@/components/theme/ThemeProvider";
import { buttonMotionClasses } from "@/components/ui/button";
import { useTranslations } from "next-intl";

// Die aktive Schaltfläche wird über die dark-Klasse am <html>-Element markiert.
// Die setzt das Inline-Skript in app/layout.tsx vor dem ersten Paint, darum
// stimmt die Darstellung sofort - ohne Mount-Flag und ohne Platzhalter.
const OPTION_CLASSES: Record<Theme, string> = {
  light:
    "bg-primary text-bg shadow dark:bg-transparent dark:text-muted dark:shadow-none dark:hover:text-text",
  dark: "text-muted hover:text-text dark:bg-primary dark:text-bg dark:shadow dark:hover:text-bg",
};

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");

  const themeOptions: Array<{ label: string; value: Theme }> = [
    { label: t("labels.light"), value: "light" },
    { label: t("labels.dark"), value: "dark" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-1 py-1 text-xs font-medium text-muted shadow-sm">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${buttonMotionClasses} ${
            OPTION_CLASSES[option.value]
          }`}
        >
          {option.label}
        </button>
      ))}
      <span className="sr-only">
        {t("currentThemeSrOnly", {
          theme: resolvedTheme ? t(`labels.${resolvedTheme}`) : resolvedTheme,
        })}
      </span>
    </div>
  );
}
