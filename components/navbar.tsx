"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import LocaleSwitcher from "./localeSwitcher";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { usePathname } from "next/navigation";
import { Button, buttonClassNames } from "@/components/ui/button";
import { PageSection } from "@/components/layout/PageSection";
import { SearchBox } from "@/components/search/SearchBox";

const Navbar = () => {
  const { data: session, status } = useSession();
  const t = useTranslations("navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const authedFromSession = Boolean(session?.user);
  const shouldRenderUsers = status === "authenticated" || (status === "loading" && authedFromSession);
  const normalizedPath = useMemo(() => {
    if (!pathname) return "/";
    if (locale) {
      const localePrefix = `/${locale}`;
      if (pathname === localePrefix) {
        return "/";
      }
      if (pathname.startsWith(`${localePrefix}/`)) {
        const trimmed = pathname.slice(localePrefix.length);
        return trimmed.length > 0 ? trimmed : "/";
      }
    }
    return pathname.length > 0 ? pathname : "/";
  }, [locale, pathname]);
  const navItems = useMemo(() => {
    const items = [
      { href: "/blogs", label: t("blogsLink") },
      { href: "/archegos", label: `Archegos-${t("case")}` },
      { href: "/greensill", label: `Greensill-${t("case")}` },
    ];
    if (shouldRenderUsers) {
      items.push({ href: "/users", label: t("users") });
    }
    items.push({ href: "/organigram", label: t("organigram") });
    items.push({ href: "/about", label: t("aboutUs") });
    return items;
  }, [t, shouldRenderUsers]);

  // Prefetch login route on mount for snappier navigation after login/logout
  useEffect(() => {
    window?.requestIdleCallback?.(() => {
      fetch("/auth/login", { method: "HEAD" }).catch(() => {});
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 text-text">
      <div className="border-b border-border/80 bg-surface/90 backdrop-blur dark:border-border/50">
        <PageSection className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3 text-left">
            <div className="relative flex h-12 w-32 items-center justify-center rounded-2xl border border-border bg-surface-2 shadow-sm">
              {/* Umschaltung über die dark-Klasse am <html>-Element: so stimmt
                  das Logo bereits beim ersten Paint. */}
              <Image
                src="/logo_lightmode.svg"
                alt={t("logoAlt")}
                width={260}
                height={260}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src="/logo_darkmode.svg"
                alt={t("logoAlt")}
                width={260}
                height={260}
                className="hidden h-8 w-auto dark:block"
                priority
              />
            </div>
            <div className="hidden text-sm font-semibold uppercase tracking-[0.35em] text-muted sm:block">
              {t("brandLockup")}
            </div>
          </Link>

          <SearchBox />

          <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium text-muted">
            {status === "loading" ? (
              <div className="flex items-center gap-3" aria-busy="true">
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
                <div className="hidden h-4 w-20 animate-pulse rounded-full bg-surface-2 sm:inline" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
              </div>
            ) : status === "authenticated" && session?.user ? (
              <>
                <Link href={`/users/${session.user.id}`} prefetch className="flex items-center gap-2">
                  <div className="relative h-9 w-9 flex-shrink-0">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={
                          session.user.name
                            ? t("userAvatarAlt", { name: session.user.name })
                            : t("userAvatarAltFallback")
                        }
                        fill
                        className="rounded-full object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-text">
                        {session.user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {session.user.name ?? session.user.email ?? t("userFallbackName")}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted hover:text-danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  aria-label={t("logoutLabel")}
                >
                  <Image
                    src="/logout_lightmode.svg"
                    alt={t("logoutLabel")}
                    width={16}
                    height={16}
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/logout_darkmode.svg"
                    alt=""
                    aria-hidden
                    width={16}
                    height={16}
                    className="hidden object-contain dark:block"
                  />
                  <span className="sr-only">{t("logoutLabel")}</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login" prefetch>
                <Button size="sm" className="shadow-lg shadow-primary/20">
                  {t("login")}
                </Button>
              </Link>
            )}
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </PageSection>
      </div>
      <div className="border-b border-border/70 bg-surface/60 dark:border-border/45">
        <PageSection>
          <nav className="flex flex-wrap gap-3 overflow-x-auto py-3 text-sm font-semibold">
            {navItems.map((item, index) => {
              const isActive = normalizedPath.startsWith(item.href);
              const navButtonClasses = buttonClassNames({
                variant: isActive ? "primary" : "secondary",
                size: "sm",
                className: "min-w-[6rem] text-center",
              });
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={navButtonClasses}
                  style={{ animationDelay: `${index * 60}ms` } as CSSProperties}
                >
                  <span className="transition-colors">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </PageSection>
      </div>
    </header>
  );
};

export default Navbar;
