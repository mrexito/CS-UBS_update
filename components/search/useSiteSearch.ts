"use client";

import { useEffect, useState } from "react";
import { MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";
import type { SearchResponse, SearchResultDTO } from "@/lib/search/types";

export type SearchStatus = "idle" | "loading" | "ready" | "error";

type SearchState = {
  status: SearchStatus;
  results: SearchResultDTO[];
};

const IDLE_STATE: SearchState = { status: "idle", results: [] };

/**
 * Fragt die Suche verzögert ab und bricht überholte Anfragen ab, damit bei
 * schneller Eingabe weder unnötige Requests laufen noch veraltete Antworten
 * eine neuere überschreiben.
 */
export function useSiteSearch(query: string, locale: string): SearchState {
  const [state, setState] = useState<SearchState>(IDLE_STATE);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setState(IDLE_STATE);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((previous) => ({ status: "loading", results: previous.results }));
      try {
        const params = new URLSearchParams({ q: trimmed, locale });
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
        const data: SearchResponse = await response.json();
        setState({ status: "ready", results: data.results });
      } catch {
        if (controller.signal.aborted) return;
        setState({ status: "error", results: [] });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  return state;
}
