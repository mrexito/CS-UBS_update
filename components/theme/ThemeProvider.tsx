"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  const applyTheme = useCallback((nextTheme: Theme, persist = true) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const resolved: ResolvedTheme = nextTheme;

    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    setResolvedTheme(resolved);

    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    setThemeState(initialTheme);
    applyTheme(initialTheme, false);
    setIsHydrated(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!isHydrated) return;
    applyTheme(theme);
  }, [theme, applyTheme, isHydrated]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
