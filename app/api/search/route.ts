import { NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { MAX_QUERY_LENGTH } from "@/lib/search/constants";
import { searchContent } from "@/lib/search/searchEngine";
import type { SearchResponse } from "@/lib/search/types";

const searchParamsSchema = z.object({
  q: z.string().max(MAX_QUERY_LENGTH),
  locale: z.enum([...routing.locales] as [string, ...string[]]).default(routing.defaultLocale),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = searchParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    locale: url.searchParams.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid search parameters", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { q, locale } = parsed.data;
  // Zu kurze oder leere Eingaben sind ein normaler UI-Zustand, kein Fehler.
  const results = await searchContent(q, locale);

  return NextResponse.json({ results } satisfies SearchResponse);
}
