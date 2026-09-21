"use client";

import { useEffect, useState } from "react";
import { MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";
import type { SearchResponse, SearchResultDTO } from "@/lib/search/types";

export type SearchStatus = "idle" | "loading" | "ready" | "error";

type SearchState = {
  status: SearchStatus;
  results: SearchResultDTO[];
};

/** Antworten gehören immer zu genau einer Eingabe, darum wird sie mitgeführt. */
type FetchedState = SearchState & { query: string };

const IDLE_STATE: SearchState = { status: "idle", results: [] };

/**
 * Fragt die Suche verzögert ab und bricht überholte Anfragen ab, damit bei
 * schneller Eingabe weder unnötige Requests laufen noch veraltete Antworten
 * eine neuere überschreiben.
 */
export function useSiteSearch(query: string, locale: string): SearchState {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  const trimmed = query.trim();
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!isActive) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFetched((previous) => ({
        status: "loading",
        results: previous?.results ?? [],
        query: trimmed,
      }));
      try {
        const params = new URLSearchParams({ q: trimmed, locale });
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
        const data: SearchResponse = await response.json();
        setFetched({ status: "ready", results: data.results, query: trimmed });
      } catch {
        if (controller.signal.aborted) return;
        setFetched({ status: "error", results: [], query: trimmed });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale, isActive]);

  // Zu kurze Eingaben brauchen keinen eigenen State: der Leerzustand ergibt
  // sich direkt aus der Eingabe.
  if (!isActive || !fetched) return IDLE_STATE;

  // Fehlt die Antwort zur aktuellen Eingabe noch, bleibt die letzte Liste
  // sichtbar, damit die Treffer beim Tippen nicht flackern.
  if (fetched.query !== trimmed) return { status: "loading", results: fetched.results };

  return { status: fetched.status, results: fetched.results };
}
