"use client";

import { useEffect, useState } from "react";
import { Theme, useTheme } from "@/components/theme/ThemeProvider";
import { buttonMotionClasses } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [isMounted, setIsMounted] = useState(false);

  const themeOptions: Array<{ label: string; value: Theme }> = [
    { label: t("labels.light"), value: "light" },
    { label: t("labels.dark"), value: "dark" },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-9 w-32 rounded-full border border-border bg-surface-2" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-1 py-1 text-xs font-medium text-muted shadow-sm">
      {themeOptions.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setTheme(option.value)}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${buttonMotionClasses} ${
              isActive ? "bg-primary text-bg shadow" : "text-muted hover:text-text"
            }`}
          >
            {option.label}
          </button>
        );
      })}
      <span className="sr-only">
        {t("currentThemeSrOnly", {
          theme: resolvedTheme ? t(`labels.${resolvedTheme}`) : resolvedTheme,
        })}
      </span>
    </div>
  );
}
