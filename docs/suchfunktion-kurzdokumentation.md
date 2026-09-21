# Suchfunktion – Kurzdokumentation

Stand: 21.09.2026 · Branch `search-feature` · Umfang: Konzept, Architekturentscheidungen, bekannte Einschränkungen

Ausführliche Herleitung, Aufgabenliste und Testprotokolle: [suchfunktion-konzept.md](suchfunktion-konzept.md).

---

## 1. Was umgesetzt wurde

Das bisher rein dekorative Suchfeld im Header ist durch eine funktionsfähige Suche über drei
Inhaltsbereiche ersetzt:

| Bereich         | Quelle                                  | Ziel eines Treffers                          |
| --------------- | --------------------------------------- | -------------------------------------------- |
| **Fälle**       | `messages/{locale}.json`, Namespace `cases` | `/{slug}` bzw. `/{slug}#<abschnitt>`     |
| **Blogs**       | Prisma-Modell `BlogPost`                | `/blogs/<id>`                                |
| **Organigramm** | Prisma-Modell `OrgChart`                | `/organigram?node=<id>` (Detail öffnet sich) |

Merkmale: Fuzzy-Suche mit Tippfehlertoleranz, Relevanz-Ranking, Hervorhebung der Treffer,
Deep-Links inkl. Sprungmarken, Mehrsprachigkeit (5 Sprachen), Tastaturbedienung und
ARIA-Combobox-Muster, Debounce und Abbruch überholter Anfragen.

## 2. Konzept

### 2.1 Datenfluss

```
Eingabe im Header
  → SearchBox.tsx (Debounce 250 ms, AbortController)
  → GET /api/search?q=…&locale=…            (Zod-Validierung)
  → searchContent(query, locale)
      → collectSearchDocuments(locale)      (alle Provider parallel)
          ├─ providers/cases.ts     → messages/{locale}.json
          ├─ providers/blogs.ts     → Prisma (unstable_cache)
          └─ providers/orgchart.ts  → getOrgChartEntries() (bereits gecacht)
      → Fuse.js (gewichtet, unscharf)
      → ausgewogene Auswahl + Snippet + Link
  → { results: SearchResultDTO[] }
  → Dropdown mit Kategorie-Badges und <mark>-Hervorhebung
```

### 2.2 Einheitliches Dokumentenmodell

Die drei Bereiche sind strukturell sehr unterschiedlich (statische, übersetzte i18n-Texte
gegenüber einsprachigen Datenbankmodellen). Sie werden deshalb alle auf ein gemeinsames
`SearchDocument` abgebildet (`lib/search/types.ts`):

- `id`, `type` (`case` | `blog` | `orgchart`), `title`
- `body` – vollständiger, HTML-freier Text; Grundlage des Matchings
- `context` – einordnende Angabe für die Anzeige (Fallname, Funktion/Abteilung)
- `path`, `hash`, `nodeId` – Bausteine des Ziel-Links, stets **ohne** Locale-Präfix
- `keywords` – aktuell die Blog-Tags

Die Trefferanzeige erhält daraus ein `SearchResultDTO` mit fertigem `href`, gekürztem
`snippet`, `score` und den umgerechneten Treffer-Positionen (`titleMatches`, `snippetMatches`).

### 2.3 Dateien

```
lib/search/
  constants.ts             MIN/MAX_QUERY_LENGTH, Debounce – importfrei, client-sicher
  types.ts                 SearchDocument, SearchResultDTO, SearchProvider
  textUtils.ts             stripHtml(), joinText(), normalizeWhitespace()
  searchEngine.ts          Fuse-Konfiguration, Auswahlregel, Snippet, Link-Aufbau
  providers/
    index.ts               Registrierung + collectSearchDocuments()
    cases.ts               CASE_SLUGS, Übersicht + je Abschnitt ein Dokument
    blogs.ts               gecachte, projizierte Prisma-Query + HTML-zu-Text
    orgchart.ts            Abbildung der bestehenden Organigramm-Einträge
app/api/search/route.ts    GET-Handler mit Zod-Validierung
components/search/
  SearchBox.tsx            ersetzt das <input> in navbar.tsx
  useSiteSearch.ts         Debounce, fetch, AbortController, Statusmodell
  HighlightedText.tsx      Hervorhebung der Treffer-Indizes
tests/search-api.test.mjs  Beispieltests gegen die API-Route
```

### 2.4 Konfigurierte Werte

| Wert                       | Einstellung  | Ort                    |
| -------------------------- | ------------ | ---------------------- |
| Mindest-/Maximallänge      | 2 / 100      | `constants.ts`         |
| Debounce                   | 250 ms       | `constants.ts`         |
| Fuse-Gewichtung            | `title` 0.5, `body` 0.2, `context` 0.15, `keywords` 0.15 | `searchEngine.ts` |
| Fuse-Schwellenwert         | 0.35, `minMatchCharLength: 2`, `ignoreLocation: true` | `searchEngine.ts` |
| Treffer je Antwort         | max. 8, davon zunächst max. 4 je Bereich | `searchEngine.ts` |
| Snippet-Länge              | 160 Zeichen  | `searchEngine.ts`      |
| Indizierte Blogbeiträge    | max. 500     | `providers/blogs.ts`   |

## 3. Architekturentscheidungen

**Provider-Pattern statt bereichsspezifischer Suchpfade.** Jeder Inhaltsbereich liefert nur
noch normalisierte Dokumente; Ranking, Snippet-Bildung und Linkaufbau existieren genau einmal.
Ein vierter Bereich wird ergänzt, indem eine Funktion der Signatur
`(locale: string) => Promise<SearchDocument[]>` geschrieben und in `providers/index.ts`
eingetragen wird – API-Route, Suchlogik und Frontend bleiben unverändert.

**Fuse.js im Speicher statt Datenbank-Volltextsuche.** Zwei der drei Bereiche liegen gar
nicht in der Datenbank (Fälle stehen in den Sprachdateien), eine datenbankseitige Suche
hätte den grössten Teil des Inhalts nicht erreicht. Fuse.js deckt alle drei Bereiche mit
einer Implementierung ab und liefert Tippfehlertoleranz, Scoring und Trefferpositionen.
MongoDB Atlas Search hätte zusätzliche Cluster-Konfiguration erfordert und wäre für
Fälle und Organigramm wirkungslos geblieben.

**Nutzereingabe erreicht nie die Datenbank.** Die Provider laden eine feste, gecachte
Grundmenge; gefiltert wird ausschliesslich im Speicher. Die Anforderung „keine ungeprüfte
Weitergabe an die Datenbank" ist damit strukturell erfüllt und nicht nur durch Validierung –
ein Ausdruck wie `{"$ne":null}` ist schlicht ein Suchbegriff ohne Treffer.

**`body` für das Matching, `snippet` erst für die Anzeige.** Würden beide im selben Feld
liegen, passten die von Fuse.js gelieferten Treffer-Positionen nicht mehr zum gekürzten
Anzeigetext. Das Kürzen samt Umrechnung der Positionen passiert daher erst beim Mapping
auf das DTO.

**Ausgewogene Trefferliste.** Ohne Begrenzung belegten die 19 Fall-Abschnitte die Liste
nahezu vollständig. Regel: zunächst höchstens 4 Treffer je Bereich, verbleibende Plätze
danach nach Relevanz auffüllen – so verdrängt kein Bereich die anderen, und bei Treffern
in nur einem Bereich bleiben trotzdem alle 8 Plätze nutzbar.

**`ignoreLocation: true`.** Ohne diese Option wertet Fuse.js Treffer, die weit hinten im
Fliesstext stehen, stark ab; längere Abschnitte wären dadurch praktisch unauffindbar.

**Deep-Links über den bestehenden State.** Fall-Abschnitte tragen im Markup bereits
`id={section.id}`, es genügt ein `#anchor`. Organigramm-Einträge haben keine eigene Route;
`?node=<id>` setzt in `OrganigramClient.tsx` den vorhandenen State `selectedNodeId`, wodurch
sich das bestehende Detail-Panel öffnet – ohne Eingriff in die d3-org-chart-Integration.
Der Parameter wird danach per `history.replaceState` entfernt, damit derselbe Treffer ein
zweites Mal angesteuert werden kann.

**`constants.ts` ohne Importe.** Die Client-Komponente braucht Mindestlänge und Debounce,
darf aber `searchEngine.ts` nicht importieren – sonst landeten Fuse.js und die
Prisma-Provider im Browser-Bundle.

**Verlinkung über `i18n/navigation.ts`.** Wegen `localePrefix: "as-needed"` (Deutsch ohne
Präfix, die vier anderen Sprachen mit) werden Pfade ohne Präfix gespeichert und
ausschliesslich über `Link`/`useRouter` aus next-intl aufgelöst, nie per String-Konkatenation.

**Caching.** Fälle sind pro Deployment statisch und werden je Sprache in einer `Map`
zwischengespeichert; Blogs nutzen `unstable_cache` mit dem bestehenden Cache-Tag
`BLOG_LIST_TAG`, werden also durch die vorhandene Blog-Revalidierung mitaktualisiert;
das Organigramm verwendet die bereits gecachte `getOrgChartEntries()`. Der Fuse-Index selbst
wird je Anfrage aufgebaut – bei rund 40 Dokumenten messbar unkritisch.

**Eigenes Dropdown statt UI-Bibliothek.** Das Projekt hat keinen UI-Baukasten (kein Radix,
Headless UI oder cmdk); eine Bibliothek nur für dieses Panel wäre unverhältnismässig gewesen.
Das Panel folgt dem vorhandenen Overlay-Muster aus `components/ui/confirm-dialog.tsx`,
die Tastatur- und ARIA-Bedienung (`combobox`/`listbox`/`option`, `aria-activedescendant`,
Live-Region) ist von Hand umgesetzt.

## 4. Abhängigkeiten, Konfiguration, Betrieb

- Einzige neue Abhängigkeit: **`fuse.js` ^7.5.0**. Nach dem Auschecken genügt `npm install`.
- **Keine** neuen Umgebungsvariablen, **keine** Datenbank-Migration, **kein** Atlas-Search-Setup.
- Neuer i18n-Namespace `search` in allen 5 Sprachdateien (`category.case|blog|orgchart`,
  `minLength`, `loading`, `noResults`, `error`, `resultsListLabel`, `resultsAnnouncement`);
  die bestehenden Keys `navbar.searchLabel` / `navbar.searchPlaceholder` sind unverändert.
- Qualitätssicherung: `npm run lint` und `npx tsc --noEmit` laufen fehlerfrei (geprüft am
  21.09.2026). `npm run test:search` führt die API-Beispieltests aus und setzt einen
  laufenden Dev-Server voraus (`npm run dev`, abweichender Port via `BASE_URL`).
- Gemessene Antwortzeiten der API: 3,6–5,3 ms warm; der erste Aufruf nach dem Start dauert
  rund 1,4 s (Kaltstart von Modulen, Datenbankverbindung, Cache-Aufbau).

## 5. Bekannte Einschränkungen

### Funktionale Grenzen

- **Blog-Tags liefern keine Treffer.** Das Feld `tags` existiert im Schema und wird von der
  Suche berücksichtigt, aber von keinem Formular befüllt. Ein Eingabefeld dafür war bewusst
  nicht Teil des Auftrags.
- **Blogbeiträge sind nicht mehrsprachig.** Sie existieren jeweils nur in einer Sprache und
  erscheinen deshalb in jeder Sprachfassung der Suche. Fälle werden dagegen korrekt nur in
  der aktiven Sprache durchsucht.
- **Keine eigene Ergebnisseite.** Die Suche zeigt maximal 8 Treffer im Dropdown; es gibt
  keine Route `/search`, kein Blättern und keine Filter nach Bereich.
- **Fuzzy-Suche ist ein Kompromiss.** Der Schwellenwert 0.35 findet Tippfehler wie
  „Archegoz", kann bei kurzen Begriffen aber auch lose Treffer einschliessen. Er lässt sich
  in `searchEngine.ts` zentral nachjustieren.
- **In-Memory-Suche skaliert begrenzt.** Bei der aktuellen Menge (rund 37 Dokumente: 21
  Fall-Dokumente je Sprache, 5 Blogbeiträge, 11 Organigramm-Einträge) ist sie deutlich schnell
  genug. Indiziert werden höchstens 500 Blogbeiträge; bei deutlichem Wachstum (Tausende
  Beiträge) sollte auf einen vorberechneten Index oder MongoDB Atlas Search umgestellt werden.
- **Kein automatisierter UI-Test.** `tests/search-api.test.mjs` prüft die API-Route gegen den
  laufenden Dev-Server und den echten Datenbestand; die Oberflächenpunkte des Testplans
  (Tastatur, Screenreader, Sprachwechsel) bleiben Handarbeit, solange kein Browser-Testläufer
  im Projekt ist. Die Tests enthalten inhaltsabhängige Suchbegriffe und müssen bei
  Inhaltsänderungen angepasst werden.
- **i18nexus.** `messages/*.json` werden laut `package.json` (`i18n:pull`) unter Umständen
  über i18nexus verwaltet. Die neuen `search`-Keys sollten dort nachgezogen werden, damit sie
  ein künftiger Pull nicht überschreibt.

### Bestehende Projektthemen, die die Suche berührt (nicht durch diese Arbeit verursacht)

- **Tailwind-Farb-Utilities sind projektweit unwirksam.** `globals.css` nutzt Tailwind 4
  (`@import "tailwindcss"`), die Farben stehen aber im Tailwind-3-Stil in `tailwind.config.ts`,
  die Tailwind 4 ohne `@config`-Direktive nicht lädt; gemessen liefern `bg-surface`,
  `bg-surface-2` und `bg-primary` alle `rgba(0,0,0,0)`. Das Ergebnis-Dropdown war dadurch
  zunächst durchsichtig. Die neuen Komponenten verwenden deshalb durchgängig
  `hsl(var(--token))` als Arbitrary Value – dasselbe Muster wie `components/ui/button.tsx`.
  Empfehlung als eigenes Arbeitspaket: `@config "../../tailwind.config.ts";` in
  `app/[locale]/globals.css` ergänzen. Das reaktiviert die Token-Klassen projektweit,
  verändert aber das Erscheinungsbild vieler bestehender Seiten.
- **Organigramm-Detailansicht ist kein echtes Vollbild-Overlay.** Das Panel nutzt
  `fixed inset-0`, liegt aber im Wrapper `animate-fade-up` aus
  `app/[locale]/organigram/page.tsx`; dessen CSS-Transform erzeugt einen Containing Block,
  sodass sich `fixed` auf diesen Container statt auf das Browserfenster bezieht (gemessen
  1200x1004 ab y=413 statt 1440x900 ab y=0). Das betrifft auch normale Klicks im Diagramm.
  Für Deep-Links wird das mit einem `scrollIntoView` auf das Detail-Panel abgefedert, die
  Ursache bleibt offen.
- **Fall-Slugs sind an mehreren Stellen hart codiert** (Navbar, Footer, Sitemap, Startseite).
  Die Suche führt mit `CASE_SLUGS` eine eigene, minimale Konstante ein, behebt die bestehende
  Duplizierung aber nicht – eine zentrale Registry ist ein separates Aufräumthema.
