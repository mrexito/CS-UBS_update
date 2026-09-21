"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MIN_QUERY_LENGTH } from "@/lib/search/constants";
import type { SearchResultDTO, SearchResultType } from "@/lib/search/types";
import { HighlightedText } from "./HighlightedText";
import { useSiteSearch } from "./useSiteSearch";

const CATEGORY_KEY: Record<SearchResultType, string> = {
  case: "category.case",
  blog: "category.blog",
  orgchart: "category.orgchart",
};

export function SearchBox() {
  const t = useTranslations("search");
  const tNavbar = useTranslations("navbar");
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // Die Markierung gehört zu einer konkreten Trefferliste. Kommt eine neue
  // Liste, verfällt sie beim Rendern von selbst - ohne Reset per Effekt.
  const [activeSelection, setActiveSelection] = useState<{
    results: SearchResultDTO[];
    index: number;
  } | null>(null);

  const containerRef = useRef<HTMLFormElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-results`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const { status, results } = useSiteSearch(query, locale);

  const activeIndex = activeSelection?.results === results ? activeSelection.index : -1;

  const selectIndex = (index: number) => setActiveSelection({ results, index });
  const clearSelection = () => setActiveSelection(null);
  const moveSelection = (step: 1 | -1) =>
    setActiveSelection((previous) => {
      const current = previous?.results === results ? previous.index : -1;
      const next =
        step === 1
          ? (current + 1) % results.length
          : current <= 0
            ? results.length - 1
            : current - 1;
      return { results, index: next };
    });

  const trimmed = query.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;
  const showPanel = isOpen && trimmed.length > 0;
  const hasResults = results.length > 0;
  const showListbox = showPanel && hasResults;

  useEffect(() => {
    if (!showPanel) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showPanel]);

  const goToResult = (result: SearchResultDTO) => {
    setIsOpen(false);
    clearSelection();
    router.push(result.href);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const target = results[activeIndex] ?? results[0];
    if (target) goToResult(target);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      clearSelection();
      return;
    }
    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      moveSelection(-1);
    }
  };

  return (
    <form
      ref={containerRef}
      role="search"
      onSubmit={handleSubmit}
      className="relative w-full flex-1 min-w-0 md:max-w-xl lg:max-w-2xl"
    >
      <label htmlFor="site-search" className="sr-only">
        {tNavbar("searchLabel")}
      </label>
      <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface-2 px-4 py-2 text-sm text-muted shadow-sm focus-within:border-primary focus-within:text-text">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden className="text-muted">
          <path
            d="M13.5 12.5l4 4m-1.5-7a6 6 0 11-12 0 6 6 0 0112 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          id="site-search"
          type="search"
          role="combobox"
          autoComplete="off"
          aria-label={tNavbar("searchLabel")}
          aria-autocomplete="list"
          aria-expanded={showListbox}
          aria-controls={showListbox ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          placeholder={tNavbar("searchPlaceholder")}
          className="w-full bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (trimmed.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {showPanel && status === "ready" ? t("resultsAnnouncement", { count: results.length }) : ""}
      </span>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-lg">
          {isTooShort ? (
            <p className="px-4 py-3 text-sm text-[hsl(var(--muted))]">{t("minLength", { count: MIN_QUERY_LENGTH })}</p>
          ) : status === "error" ? (
            <p className="px-4 py-3 text-sm text-[hsl(var(--danger))]">{t("error")}</p>
          ) : hasResults ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t("resultsListLabel")}
              className="max-h-[70vh] overflow-y-auto py-1"
            >
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => selectIndex(index)}
                  className={index === activeIndex ? "bg-[hsl(var(--surface-2))]" : ""}
                >
                  <Link
                    href={result.href}
                    tabIndex={-1}
                    onClick={() => {
                      setIsOpen(false);
                      clearSelection();
                    }}
                    className="block px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex shrink-0 items-center rounded-full bg-[hsl(var(--surface-2))] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--muted))]">
                        {t(CATEGORY_KEY[result.type])}
                      </span>
                      {result.context && (
                        <span className="truncate text-xs text-[hsl(var(--muted))]">{result.context}</span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-[hsl(var(--text))]">
                      <HighlightedText text={result.title} ranges={result.titleMatches} />
                    </span>
                    {result.snippet && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-[hsl(var(--muted))]">
                        <HighlightedText text={result.snippet} ranges={result.snippetMatches} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : status === "ready" ? (
            <p className="px-4 py-3 text-sm text-[hsl(var(--muted))]">{t("noResults", { query: trimmed })}</p>
          ) : (
            <p className="px-4 py-3 text-sm text-[hsl(var(--muted))]">{t("loading")}</p>
          )}
        </div>
      )}
    </form>
  );
}
