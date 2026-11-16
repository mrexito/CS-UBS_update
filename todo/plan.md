# Umsetzungsplan – Themenbereich "Regulatory Compliance"

Grundlage: [task.md](task.md) sowie die Mockups `image003.png` (Navigation), `image006.png` (Übersicht) und `image007.png` (Kapitel 7 / Kapitalquoten).

## Entscheidungen (geklärt)

| Thema                    | Entscheidung                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daten Tabelle 5 / 6      | Nur der Auszug aus dem Mockup (4 Quartale). Keine vollständige Zeitreihe Q1 2019–Q2 2023.                                                                                             |
| Fehlende Werte Tabelle 6 | Nur die sichtbaren Werte verwenden, Rest bleibt leer (`null`, Anzeige "–").                                                                                                           |
| Sprachen                 | Alle 5 Sprachen (de, en, fr, es, it) über `messages/*.json`.                                                                                                                          |
| Slugs                    | Gleiche Slugs für alle Sprachen. `i18n/routing.ts` hat keine `pathnames`, alle bestehenden Routen sind englisch (`/blogs`, `/archegos`, `/about`). Deshalb auch hier englische Slugs. |
| SEO / Suche              | Neue Seiten in `app/sitemap.ts` und in die Site-Suche (`lib/search/providers`) aufnehmen.                                                                                             |

### Routen

| Thema                     | Route                                             | Status                     |
| ------------------------- | ------------------------------------------------- | -------------------------- |
| Übersicht                 | `/regulatory-compliance`                          | Inhalt                     |
| Kapitalquoten (Kapitel 7) | `/regulatory-compliance/capital-ratios`           | Inhalt (Tabellen + Charts) |
| Liquidität                | `/regulatory-compliance/liquidity`                | Platzhalter                |
| Krise & Marktvertrauen    | `/regulatory-compliance/crisis-market-confidence` | Platzhalter                |
| Regulatorische Massnahmen | `/regulatory-compliance/regulatory-measures`      | Platzhalter                |
| AT1-Instrumente           | `/regulatory-compliance/at1-instruments`          | Platzhalter                |

---

## Parallelisierung (für Agents)

Die Umsetzung läuft in 3 Phasen. Phase 1 und Phase 3 erledigt je **ein** Agent nacheinander. In Phase 2 arbeiten 5 Agents (Tracks A–E) **gleichzeitig**, jeder in einem eigenen Git-Worktree und auf einem eigenen Branch.

```
Phase 1: Foundation (seriell)
            │
Phase 2:    ├── Track A – Navigation
            ├── Track B – Übersicht + Platzhalter
            ├── Track C – Kapitel 7
            ├── Track D – Sitemap + Suche
            └── Track E – Übersetzungen
            │
Phase 3: Integration + Prüfung (seriell)
```

### Regeln für alle Tracks

1. **Nur die eigenen Dateien ändern.** Jeder Track hat unten eine Liste "Besitzt". Jede andere Datei ist für diesen Track tabu. Ausnahme: Lesen ist immer erlaubt.
2. **Der Vertrag aus Phase 1 ist fix.** `RC_TOPICS`, `RC_BASE_PATH`, die Slugs, die Struktur der Message-Keys und die Anker-IDs (`rwa`, `leverage`) werden in Phase 2 nicht verändert.
3. **Fehlt ein Message-Key, wird er nicht selbst angelegt.** Den Key im Abschlussbericht des Tracks unter "Fehlende Keys" aufführen. Phase 3 trägt ihn nach.
4. `messages/de.json` **gehört nach Phase 1 niemandem mehr.** Textkorrekturen am Deutschen ebenfalls unter "Fehlende Keys / Textkorrekturen" melden.
5. **Kein** `npm install` in Phase 2. Die Abhängigkeiten installiert Phase 1.
6. Jeder Track prüft vor Abschluss mindestens `npm run lint` und `npx tsc --noEmit` für seine Dateien.
7. Kein Eszett in Texten oder Kommentaren (Schweizer Schreibweise, z. B. "Massnahmen").
8. Abschlussbericht pro Track: geänderte Dateien, offene Punkte, fehlende Keys, Ergebnis von Lint und Typecheck.

### Phase 1 – Foundation (ein Agent, Branch `rc/foundation`)

Ziel: alles anlegen, wovon mehr als ein Track abhängt. Danach wird `rc/foundation` nach `main` (oder in einen Integrations-Branch `rc/integration`) gemergt, und alle Tracks starten von diesem Stand.

1. Schritt 0 komplett: Next-16-Doku lesen, `npm install recharts`, `lib/regulatoryCompliance.ts` mit `RC_BASE_PATH` und `RC_TOPICS` anlegen.
2. Alle Message-Keys aus Schritt 5 anlegen:

- `messages/de.json`: vollständiger deutscher Text aus den Mockups (Navbar, Übersicht, Themenkarten, Storyline, Platzhalter, Kapitel 7 inkl. Kernaussagen, Abschnitte, Spaltenüberschriften, Quellenangabe als TODO-Platzhalter).
- `messages/en,fr,es,it.json`: dieselben Keys, vorerst mit dem deutschen Text als Platzhalter, damit kein Track an fehlenden Keys scheitert.
- `search.category.regulatoryCompliance` in allen 5 Dateien.

3. Anker-IDs festhalten: Die Abschnitte auf der Kapitel-7-Seite heissen `id="rwa"` (7.1) und `id="leverage"` (7.2).
4. `npm run lint`, `npx tsc --noEmit` und `npm run build` laufen fehlerfrei.

### Phase 2 – Tracks (parallel)

#### Track A – Navigation (Branch `rc/nav`)

- **Plan-Schritt:** Schritt 1
- **Besitzt:** `components/navbar.tsx`
- **Liest:** `lib/regulatoryCompliance.ts`, `components/ui/button.tsx`, Keys `navbar.regulatoryCompliance`, `navbar.regulatoryComplianceTopics`, `regulatoryCompliance.topics.*.title`
- **Fertig, wenn:** Die Haupt-Pill erscheint nach Greensill. Die zweite Pill-Reihe erscheint nur unter `/regulatory-compliance`\*, auch mit Locale-Prefix. Die aktive Pill stimmt. Auf der Übersicht ist keine Unter-Pill aktiv.

#### Track B – Übersicht + Platzhalter (Branch `rc/overview`)

- **Plan-Schritt:** Schritt 2 und Schritt 3 (nur die dynamische Route `[topic]`)
- **Besitzt:** `app/[locale]/regulatory-compliance/page.tsx`, `app/[locale]/regulatory-compliance/[topic]/page.tsx`
- **Liest:** `lib/regulatoryCompliance.ts`, `app/[locale]/archegos/page.tsx` (Muster), `lib/seo.ts`, Keys `regulatoryCompliance.overview.`_, `.topics._`, `.placeholder.\*`
- **Nicht anfassen:** `capital-ratios/` (gehört Track C)
- **Fertig, wenn:** Die Übersicht entspricht `image006.png` (5 Karten, Storyline-Karte, Ablauf-Leiste). Die 4 Platzhalter-Routen zeigen Titel und "Inhalt folgt". Unbekannte Slugs ergeben 404.

#### Track C – Kapitel 7 / Kapitalquoten (Branch `rc/capital`)

- **Plan-Schritt:** Schritt 4
- **Besitzt:** `lib/regulatoryCompliance/capitalRatios.ts`, `components/regulatoryCompliance/RatioChart.tsx`, `components/regulatoryCompliance/RatioTable.tsx`, `app/[locale]/regulatory-compliance/capital-ratios/page.tsx`
- **Liest:** `lib/regulatoryCompliance.ts`, `app/[locale]/archegos/page.tsx` (Takeaways- und Referenz-Box), `app/[locale]/globals.css` (Farb-Variablen), Keys `regulatoryCompliance.capitalRatios.`\*
- **Achtung:** Falls `lib/regulatoryCompliance.ts` in Phase 1 als Datei angelegt wurde, die Daten trotzdem unter `lib/regulatoryCompliance/capitalRatios.ts` ablegen und **nicht** in einen Ordner umbauen. Ein Umbau wäre eine Vertragsänderung (Regel 2) und wird in Phase 3 entschieden.
- **Fertig, wenn:** Die Seite entspricht `image007.png`: Kernaussagen, 7.1 und 7.2 je mit Chart und Tabelle, Quellenangabe, Weiter-Link. Die Abschnitte tragen `id="rwa"` und `id="leverage"`. `npm run build` zeigt keinen SSR-Fehler durch Recharts.

#### Track D – Sitemap + Suche (Branch `rc/search`)

- **Plan-Schritt:** Schritt 6 und Schritt 7
- **Besitzt:** `app/sitemap.ts`, `lib/search/types.ts`, `lib/search/providers/index.ts`, `lib/search/providers/regulatoryCompliance.ts`, `components/search/SearchBox.tsx` (nur falls nötig), `tests/search-api.test.mjs`, `docs/suchfunktion-kurzdokumentation.md`
- **Liest:** `lib/regulatoryCompliance.ts`, `lib/search/providers/cases.ts` (Muster), Message-Struktur `regulatoryCompliance.`\*
- **Abhängigkeit:** Der Provider verlinkt auf `/regulatory-compliance/capital-ratios#rwa` bzw. `#leverage`, gemäss Vertrag aus Phase 1. Ob die Seite existiert, ist für diesen Track egal. Der Test prüft nur das Suchergebnis, nicht die gerenderte Seite.
- **Fertig, wenn:** `npm run test:search` ist grün. Eine Suche nach "CET1" oder "Kapitalquoten" liefert `/regulatory-compliance/capital-ratios`. `/sitemap.xml` enthält alle 6 neuen Pfade pro Locale.

#### Track E – Übersetzungen (Branch `rc/i18n`)

- **Plan-Schritt:** Schritt 5, Punkt 3 (en/fr/es/it)
- **Besitzt:** `messages/en.json`, `messages/fr.json`, `messages/es.json`, `messages/it.json`, und dort nur die Keys unter `navbar.regulatoryCompliance`_, `search.category.regulatoryCompliance` und `regulatoryCompliance._`
- **Liest:** `messages/de.json` (Quelle)
- **Auftrag:** Beispiel-Content erstellen, also die deutschen Platzhalter aus Phase 1 in en/fr/es/it übersetzen. Fachbegriffe wie CET1, TLAC, Going Concern, Gone Concern, AT1, RWA und FINMA bleiben unübersetzt.
- **Fertig, wenn:** Alle 4 Dateien enthalten exakt dieselben Keys wie `de.json` (Struktur-Diff leer), es gibt keinen deutschen Text mehr in diesen Keys, und die Dateien sind gültiges JSON.

### Phase 3 – Integration (ein Agent, Branch `rc/integration`)

1. Die Branches in dieser Reihenfolge mergen: `rc/i18n` → `rc/capital` → `rc/overview` → `rc/nav` → `rc/search`. Konflikte sollte es nach den Regeln oben nicht geben. Falls doch, hat der Vertrag aus Phase 1 Vorrang.
2. Gemeldete "Fehlende Keys / Textkorrekturen" aller Tracks in alle 5 Message-Dateien eintragen.
3. Schritt 8 komplett ausführen: Lint, Typecheck, `npm run test:search`, `npm run build` und die manuelle Prüfung.
4. Offene Punkte (siehe unten) im Abschlussbericht auflisten.

---

## Schritt 0 – Vorbereitung

1. Next.js-16-Doku lesen (laut `AGENTS.md`): `node_modules/next/dist/docs/01-app/` zu Routing, `generateMetadata`, `generateStaticParams` sowie Server- und Client-Komponenten.
2. Recharts installieren (bisher nicht in `package.json`): `npm install recharts`. Vor dem Einbau prüfen, ob die Peer-Dependencies zu React 19.2 passen.
3. Gemeinsame Konfiguration anlegen: `lib/regulatoryCompliance.ts`

```ts
export const RC_BASE_PATH = "/regulatory-compliance";
export const RC_TOPICS = [
  { slug: "capital-ratios", key: "capitalRatios", hasContent: true },
  { slug: "liquidity", key: "liquidity", hasContent: false },
  { slug: "crisis-market-confidence", key: "crisis", hasContent: false },
  { slug: "regulatory-measures", key: "measures", hasContent: false },
  { slug: "at1-instruments", key: "at1", hasContent: false },
] as const;
```

Diese Datei ist die einzige Quelle für Slugs und Reihenfolge. Navbar, Übersicht, Platzhalter-Route, Sitemap und Suche lesen daraus (analog zu `CASE_SLUGS` in `lib/search/providers/cases.ts`).

## Schritt 1 – Navigation (`components/navbar.tsx`), Mockup `image003.png`

1. In `navItems` nach dem Greensill-Eintrag `{ href: "/regulatory-compliance", label: t("regulatoryCompliance") }` ergänzen. Die Reihenfolge laut Mockup ist Blogs · Archegos · Greensill · **Regulatory Compliance** · (Users) · Organigramm · Über uns.
2. Unter dem bestehenden `<nav>` eine zweite Pill-Reihe einfügen, die nur gerendert wird, wenn `normalizedPath.startsWith("/regulatory-compliance")` zutrifft:

- Eigener Container mit derselben Struktur (`border-b … bg-surface/60`, `PageSection`), optisch leicht abgesetzt (z. B. `bg-surface-2/60`).
- Label darüber: `REGULATORY COMPLIANCE — THEMEN` (Klassen wie die bestehenden Eyebrows: `text-xs font-semibold uppercase tracking-[0.3em] text-muted`).
- Pills aus `RC_TOPICS` erzeugen, mit **genau** demselben Muster wie die Hauptnavigation: `buttonClassNames({ variant: isActive ? "primary" : "secondary", size: "sm", className: "min-w-[6rem] text-center" })`, `isActive = normalizedPath.startsWith(href)`, `aria-current`.
- Kein Dropdown und kein neues Widget.
- Auf der Übersicht `/regulatory-compliance` ist keine Unter-Pill aktiv. Die Haupt-Pill "Regulatory Compliance" bleibt dagegen auf allen Unterseiten aktiv, das ergibt sich automatisch aus `startsWith`.

1. Optional: Die Pill-Logik in eine kleine lokale Funktion `renderPill(item, index)` auslagern, damit beide Reihen denselben Code nutzen.
2. `aria-label` für die zweite `<nav>` setzen (z. B. `t("regulatoryComplianceTopics")`), damit sich die beiden Navigationen unterscheiden lassen.

## Schritt 2 – Übersichtsseite, Mockup `image006.png`

Datei: `app/[locale]/regulatory-compliance/page.tsx` (Server-Komponente, Aufbau wie `archegos/page.tsx`: `setRequestLocale`, `getTranslations`, `generateMetadata` mit `buildAlternates({ path: "/regulatory-compliance" })`, `revalidate = 3600`).

Inhalt:

1. **Header** (zentriert): Eyebrow "FALLSTUDIE · BACHELORARBEIT", H1 "Regulatory Compliance", Lead-Text.
2. **Kartenraster** (`grid sm:grid-cols-2 lg:grid-cols-3 gap-6`) mit 5 Karten aus `RC_TOPICS`, jeweils als `<Link>`:

- Punkt oben links: blau (`bg-primary`) bei Themen mit Inhalt, sonst grau (`bg-muted/40`).
- Pfeil-Icon oben rechts als Inline-SVG, weil keine Icon-Library vorhanden ist. Blau bei Themen mit Inhalt, sonst grau, beim Hover `text-primary`.
- Titel, Kurzbeschreibung und Meta-Zeile (z. B. "Tabelle 5 · Tabelle 6", "Tabelle 7", "Marktdaten & Ratings", "Recovery & Resolution", "Tabelle 9").
- Kartenstil wie die bestehenden Boxen: `rounded-3xl border border-border/70 bg-surface/70 p-6 shadow-lg`, mit Hover-Effekt.

1. **Storyline-Karte** als 6. Kachel im Raster: dunkler Hintergrund (`bg-slate-900 text-white`, auch im Dark Mode kontrastreich), Titel "Storyline" in `text-primary`, ohne Link.
2. **Ablauf-Leiste** unter dem Raster, mit `border-t` abgetrennt: Label "ABLAUF", danach Kapital → Liquidität → Krise → Massnahmen → AT1. "Kapital" ist hervorgehoben (`text-primary`). Die Einträge verlinken auf die Unterseiten.

## Schritt 3 – Unterseiten / Platzhalter

1. `app/[locale]/regulatory-compliance/capital-ratios/page.tsx`: eigene Seite mit Inhalt (siehe Schritt 4).
2. `app/[locale]/regulatory-compliance/[topic]/page.tsx`: eine dynamische Route für die 4 Platzhalter.

- `generateStaticParams` liefert alle `RC_TOPICS` mit `hasContent === false`. Für den statischen Pfad `capital-ratios` greift ohnehin die eigene Seite.
- Ist `topic` unbekannt oder hat Inhalt, wird `notFound()` aufgerufen. `dynamicParams = false` vorher in der Next-16-Doku prüfen.
- Inhalt: Zurück-Link "‹ Regulatory Compliance", Eyebrow, H1 = Thementitel, Text "Inhalt folgt" (übersetzt).
- `generateMetadata` mit Titel des Themas.
- Alternative ohne dynamische Route: 4 einzelne `page.tsx`, die eine gemeinsame Komponente `components/regulatoryCompliance/PlaceholderPage.tsx` rendern. Die dynamische Route ist weniger Code und deshalb vorzuziehen.

## Schritt 4 – Kapitel-7-Seite (Kapitalquoten), Mockup `image007.png`

### 4.1 Daten: `lib/regulatoryCompliance/capitalRatios.ts`

Zahlen sind sprachunabhängig und kommen deshalb nicht in die messages. Werte in %:

**Tabelle 5 – CS Capital (RWA-based) Ratios, Auszug**

| Quartal | CET1  | Ziel CET1 | Going Concern | Gone Concern | TLAC  |
| ------- | ----- | --------- | ------------- | ------------ | ----- |
| Q1 2019 | 12.53 | 9.97      | 17.35         | 12.54        | 29.89 |
| Q4 2022 | 14.06 | 9.60      | 19.93         | 19.57        | 39.51 |
| Q1 2023 | 20.26 | 9.64      | 20.26         | 19.89        | 40.15 |
| Q2 2023 | 14.40 | 10.60     | 17.00         | 16.00        | 33.00 |

**Tabelle 6 – CS Leverage Ratios, Auszug** (nur sichtbare Werte, Rest `null`)

| Quartal | CET1 Lev. | Ziel | Going Concern | Gone Concern | TLAC  |
| ------- | --------- | ---- | ------------- | ------------ | ----- |
| Q1 2019 | 4.04      | 3.20 | 5.59          | 4.04         | 9.64  |
| Q4 2022 | 5.42      | 3.25 | 7.69          | 7.55         | 15.24 |
| Q1 2023 | 7.56      | –    | –             | –            | –     |
| Q2 2023 | –         | –    | –             | –            | –     |

> ⚠️ Die Q4-2022-Zeile von Tabelle 6 ist im Mockup abgeschnitten und wurde abgelesen. Vor dem Merge mit der Quelle vergleichen.

Typ: `{ quarter: string; cet1: number | null; target: number | null; goingConcern: …; goneConcern: …; tlac: … }[]`.

### 4.2 Chart-Komponente: `components/regulatoryCompliance/RatioChart.tsx`

- `"use client"`, weil Recharts nur im Browser läuft.
- Props: `data`, `actualKey`, `targetKey`, `actualLabel`, `targetLabel`, `title`, `color` ("primary" | "success").
- `ResponsiveContainer` → `LineChart`:
  - `Line` Ist-Wert durchgezogen: CET1 in `hsl(var(--primary))`, Leverage in `hsl(var(--success))`.
  - `Line` Zielwert gestrichelt (`strokeDasharray="4 4"`), grau.
  - Label am Maximum, z. B. "20.26%" (eigenes `label`/`dot` nur am höchsten Punkt).
  - `XAxis dataKey="quarter"`, `YAxis` in %, `Tooltip`, `Legend` oben rechts.
  - `connectNulls` für die fehlenden Leverage-Werte.
- Farben über CSS-Variablen, damit Light und Dark Mode funktionieren.
- In einer Karte rendern (`rounded-3xl border … p-6`) mit Titel oben links, z. B. "CET1-Quote: Ist vs. Zielwert (%)".
- Hinweis: Mit dem Auszug hat der Chart nur 4 Punkte. Das ist gewollt, siehe Entscheidungen.

### 4.3 Tabellen-Komponente: `components/regulatoryCompliance/RatioTable.tsx`

- Server-Komponente, semantisches `<table>` mit `<caption>` (z. B. "Tabelle 5 — CS Capital (RWA-based) Ratios in %, 2019–2023 (Auszug)").
- `null` wird als "–" angezeigt, Zahlen mit 2 Nachkommastellen.
- Wrapper `overflow-x-auto` für Mobile, Stil passend zu den Karten.

### 4.4 Seite: `app/[locale]/regulatory-compliance/capital-ratios/page.tsx`

Aufbau gemäss Mockup, linksbündig in `max-w-4xl`:

1. Zurück-Link "‹ Regulatory Compliance" → `/regulatory-compliance`.
2. Eyebrow "KAPITEL 7 · CAPITAL COMPLIANCE ANALYSIS".
3. H1 "Kapitalanforderungen: Blieb CS regulatorisch compliant?" und Lead-Text.
4. **Key-Takeaways-Box** ("KERNAUSSAGEN", 3 Punkte), gleiche Markup-Struktur wie die Takeaways auf `archegos/page.tsx`.
5. **7.1 RWA-basierte Kapitalquoten**: Einleitung, `RatioChart` (CET1 vs. Ziel CET1), `RatioTable` (Tabelle 5).
6. **7.2 Leverage-basierte Kapitalquoten**: Einleitung, `RatioChart` (CET1 Lev. vs. Ziel, grün), `RatioTable` (Tabelle 6).
7. **Quellenangabe**: Box wie `#referenz` auf der Archegos-Seite, Inhalt aus den messages (`reference.title`, `reference.lines`).
8. Weiter-Link zum nächsten Thema "Liquidität →".

- `generateMetadata`, `revalidate = 3600`, `setRequestLocale` wie bei den anderen Seiten.

> ❓ **Offen:** Der genaue Text der Quellenangabe ist nicht im Mockup sichtbar und muss geliefert werden (Bachelorarbeit, CS-Geschäftsberichte, FINMA?). Bis dahin einen Platzhalter-Key mit TODO anlegen.

## Schritt 5 – Übersetzungen (`messages/{de,en,fr,es,it}.json`)

1. `navbar`: `regulatoryCompliance`, `regulatoryComplianceTopics` (Label der zweiten Pill-Reihe).
2. Neuer Namespace `regulatoryCompliance`:

```jsonc
 {
   "overview": { "eyebrow", "title", "lead", "storyline": { "title", "text" }, "flowLabel" },
   "topics": {
     "capitalRatios": { "title", "short", "description", "meta" },
     "liquidity": { … }, "crisis": { … }, "measures": { … }, "at1": { … }
   },
   "placeholder": { "back", "comingSoon" },
   "capitalRatios": {
     "eyebrow", "title", "lead",
     "labels": { "takeaways", "reference", "next", "actual", "target", "quarter" },
     "keyTakeaways": [ … ],
     "sections": {
       "rwa": { "title", "intro", "chartTitle", "tableCaption", "columns": { … } },
       "leverage": { … }
     },
     "reference": { "title", "lines": [ … ] }
   }
 }
```

1. Den deutschen Text aus den Mockups übernehmen, ohne Eszett (Schweizer Schreibweise, z. B. "Massnahmen", "massgeblich"). en/fr/es/it übersetzen oder über i18nexus pflegen (`npm run i18n:pull`), dabei klären, ob die Keys dort angelegt werden.
2. `search.category`: neuer Key `regulatoryCompliance` in allen 5 Sprachen (siehe Schritt 7).

## Schritt 6 – Sitemap (`app/sitemap.ts`)

`staticPaths` um `/regulatory-compliance` und alle `RC_TOPICS` ergänzen (`${RC_BASE_PATH}/${slug}`), mit Import aus `lib/regulatoryCompliance.ts`.

## Schritt 7 – Suche (`lib/search`)

1. `lib/search/types.ts`: `SearchResultType` um `"regulatoryCompliance"` erweitern.
2. Neuer Provider `lib/search/providers/regulatoryCompliance.ts` nach dem Muster von `cases.ts`:

- Lädt `messages.regulatoryCompliance` pro Locale und cached das Ergebnis.
- Dokumente: Übersicht (`/regulatory-compliance`), je Thema eines (Titel + Beschreibung), für Kapitalquoten zusätzlich je Abschnitt (7.1 / 7.2) mit `hash` für die Sprungmarke. Dafür brauchen die Abschnitte auf der Seite eine `id` (`id="rwa"`, `id="leverage"`, `scroll-mt-24`).

1. In `lib/search/providers/index.ts` registrieren.
2. Prüfen, wo `type` in der UI ausgewertet wird (`components/search/SearchBox.tsx`, Kategorie-Label `search.category.*`), und die neue Kategorie ergänzen.
3. `tests/search-api.test.mjs` um einen Test erweitern: Die Suche nach "CET1" oder "Kapitalquoten" findet `/regulatory-compliance/capital-ratios`.
4. Kurz in `docs/suchfunktion-kurzdokumentation.md` vermerken, dass ein neuer Provider dazugekommen ist.

## Schritt 8 – Prüfung

1. `npm run lint` und Typecheck (`npx tsc --noEmit`).
2. `npm run test:search`.
3. `npm run build`: Prüfen, dass alle 6 Routen statisch generiert werden und Recharts keinen SSR-Fehler auslöst.
4. Manuell mit `npm run dev`:

- Zweite Pill-Reihe erscheint nur unter `/regulatory-compliance/*`, die richtige Pill ist aktiv, auch mit Locale-Prefix (`/en/regulatory-compliance/…`).
- Alle 5 Karten verlinken korrekt, Platzhalter zeigen "Inhalt folgt".
- Charts und Tabellen in Light und Dark Mode, Mobile-Breite ohne horizontales Scrollen der Seite (Tabellen scrollen im Wrapper).
- Sprachwechsel funktioniert auf allen neuen Seiten.
- `/sitemap.xml` enthält die neuen URLs.

## Betroffene Dateien (Übersicht)

**Neu**

- `lib/regulatoryCompliance.ts`
- `lib/regulatoryCompliance/capitalRatios.ts`, alternativ beide in einem Ordner `lib/regulatoryCompliance/{index,capitalRatios}.ts`
- `app/[locale]/regulatory-compliance/page.tsx`
- `app/[locale]/regulatory-compliance/capital-ratios/page.tsx`
- `app/[locale]/regulatory-compliance/[topic]/page.tsx`
- `components/regulatoryCompliance/RatioChart.tsx`
- `components/regulatoryCompliance/RatioTable.tsx`
- `lib/search/providers/regulatoryCompliance.ts`

**Geändert**

- `package.json` / `package-lock.json` (recharts)
- `components/navbar.tsx`
- `messages/de.json`, `en.json`, `fr.json`, `es.json`, `it.json`
- `app/sitemap.ts`
- `lib/search/types.ts`, `lib/search/providers/index.ts`, ggf. `components/search/SearchBox.tsx`
- `tests/search-api.test.mjs`, `docs/suchfunktion-kurzdokumentation.md`

## Offene Punkte

1. Text der Quellenangabe für Kapitel 7.
2. Kontrolle der abgelesenen Q4-2022-Werte aus Tabelle 6.
3. Übersetzungen fr/es/it: Werden sie von uns erstellt oder über i18nexus gepflegt? -> beispiel content erstellen
