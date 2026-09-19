# Konzept: Suchfunktion für CS-UBS-Fusion

## 1. Ausgangslage

Das bestehende Suchfeld im Header (`components/navbar.tsx:80-102`) ist vollständig fertig gestylt und mehrsprachig beschriftet (`navbar.searchLabel`, `navbar.searchPlaceholder` in allen 5 Sprachdateien), aber funktionslos: unkontrolliertes `<input>`, kein `onChange`, kein `onSubmit`, kein State. Es soll eine echte Suche über die drei Inhaltsbereiche **Fälle**, **Blogs** und **Organigramm** angebunden werden.

## 2. Bestandsaufnahme (Rechercheergebnis)

| Bereich       | Fundort                                                                                                | Besonderheit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suchfeld      | `components/navbar.tsx:80-102` (Client-Komponente, `useLocale()` bereits vorhanden)                    | Rein dekorativ, keine Logik                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Fälle         | `messages/{locale}.json`, Namespace `cases.archegos` / `cases.greensill`                               | **Keine** DB, **keine** MDX-Dateien – Inhalt liegt komplett in den next-intl-Sprachdateien. Struktur: `title`, `lead`, `sections[].{id,title,paragraphs}`, `keyTakeaways[]`, `timelineEntries[]`. Abschnitte tragen bereits `id={section.id}` im Markup → Deep-Links per `#anchor` funktionieren ohne Änderung an den Case-Pages. Keine zentrale Slug-Registry (Slugs sind an 4 Stellen hart codiert: Navbar, Footer, Sitemap, Startseite). Gesamtgrösse trivial (~11-14 KB JSON je Fall/Sprache). |
| Blogs         | `prisma/schema.prisma` (`BlogPost`), `app/[locale]/blogs/*`                                            | Felder `title`, `content` (HTML aus Quill), `excerpt`, `tags[]` (aktuell nie befüllt). Keine REST-API, nur Server Actions (`app/[locale]/blogs/actions.ts`) und direkte Prisma-Queries in Server Components. Detailroute `/{locale}/blogs/{id}`. Kein Volltextindex.                                                                                                                                                                                                                               |
| Organigramm   | `prisma/schema.prisma` (`OrgChart`), `lib/orgChart.ts`, `app/[locale]/organigram/OrganigramClient.tsx` | Ein selbstreferenzierendes Modell (`DIVISION`/`PERSON`). `GET /api/org-chart` liefert bereits alle Einträge über die gecachte Funktion `getOrgChartEntries()`. **Kein** eigener Detail-Link je Eintrag – der ganze Baum liegt auf `/organigram`, Klick auf einen Knoten öffnet ein Modal über lokalen React-State (`selectedNodeId`). Kein Volltextindex.                                                                                                                                          |
| Routing       | `i18n/routing.ts`                                                                                      | `localePrefix: "as-needed"` – Deutsch (Standard) ohne Präfix, andere 4 Sprachen mit. Verlinkung muss über `Link`/`getPathname` aus `i18n/navigation.ts` laufen, nicht über manuelle String-Konkatenation.                                                                                                                                                                                                                                                                                          |
| Infrastruktur | `package.json`                                                                                         | Keine Fuzzy-Search-Bibliothek, kein Debounce-Hook, kein SWR/React Query, keine Dropdown-Bibliothek (kein Radix/Headless UI/cmdk) installiert. `mongodb+srv`-Atlas-Cluster vorhanden, aber keine Atlas-Search-Konfiguration.                                                                                                                                                                                                                                                                        |

## 3. Architekturentscheidung

Die drei Inhaltsbereiche sind strukturell sehr unterschiedlich (statische i18n-Texte vs. Datenbank-Modelle, mehrsprachig vs. einsprachig). Um damit sauber umzugehen, wird ein **einheitliches Dokumentenmodell mit Provider-Pattern** eingeführt:

1. Jeder Inhaltsbereich bekommt eine eigene **Provider-Funktion**, die seine Daten in ein gemeinsames, normalisiertes `SearchDocument`-Format überführt.
2. Eine zentrale **Suchlogik** führt alle Dokumente zusammen und durchsucht sie einheitlich mit **Fuse.js** (kleine, weit verbreitete Fuzzy-Search-Bibliothek, ~12 KB, keine eigenen Abhängigkeiten) – das liefert Tippfehler-/Teilstring-Toleranz, Relevanz-Scoring und Trefferpositionen (für die Hervorhebung) für alle drei Bereiche gleichzeitig, ohne Datenbank-spezifische Suchlogik (kein MongoDB-Textindex/Atlas Search nötig – bei der aktuellen, kleinen Datenmenge unnötiger Mehraufwand).
3. Eine einzelne API-Route (`GET /api/search`) kapselt Aufruf, Validierung und Antwortformat.
4. Eine neue Client-Komponente ersetzt das tote `<input>` im Header und übernimmt Debounce, Tastaturbedienung, Barrierefreiheit und Ergebnisanzeige.

**Erweiterbarkeit:** Ein vierter Inhaltsbereich lässt sich später mit einer neuen Provider-Funktion (gleiche `SearchDocument`-Signatur) plus Registrierung in der Merge-Liste ergänzen – ohne Änderungen an API-Route, Suchlogik oder Frontend-Komponente.

### Getroffene Entscheidungen (mit Auftraggeber abgestimmt)

- **Fuse.js** statt Eigenimplementierung für Fuzzy-Matching.
- **Deep-Link zu Organigramm-Einträgen** via `?node=<id>`-Query-Parameter, den `OrganigramClient.tsx` beim Laden ausliest und das passende Detail-Modal automatisch öffnet.
- **Blog-Tags** werden durchsuchbar gemacht, aber es wird kein neues Tag-Eingabefeld in den Blog-Formularen ergänzt (Feld bleibt vorerst ungenutzt – siehe Einschränkungen).

## 4. Technisches Design

### 4.1 Neue Dateien

```
lib/search/
  types.ts               # SearchDocument, SearchResultDTO, SearchProvider
  textUtils.ts            # stripHtml() auf Basis von sanitize-html (bereits Abhängigkeit)
  searchEngine.ts          # Fuse.js-Konfiguration, Merge + Suche, Mapping auf SearchResultDTO
  providers/
    index.ts               # Registrierung aller Bereiche + collectSearchDocuments()
    cases.ts               # liest messages/{locale}.json, Namespace "cases", pro Locale gecacht
    blogs.ts                # gecachte, projizierte Prisma-Query + HTML-Bereinigung
    orgchart.ts             # nutzt bestehende getOrgChartEntries()
app/api/search/route.ts     # GET-Handler, Zod-Validierung, analog app/api/org-chart/route.ts
components/search/
  SearchBox.tsx             # ersetzt das <input> in navbar.tsx
  useDebouncedSearch.ts      # kleiner Hook: Debounce + fetch + AbortController
  highlight.tsx             # Hilfsfunktion zum Hervorheben von Treffer-Indizes
```

> Abweichung gegenüber dem ursprünglichen Entwurf: Die Blog-Projektionsquery liegt direkt in
> `providers/blogs.ts` statt in einer eigenen Datei `lib/blogSearchProjection.ts` – sie wird
> ausschliesslich von der Suche verwendet, und so bleibt ein Inhaltsbereich vollständig in
> einer Datei gekapselt.

### 4.2 Gemeinsames Datenmodell (`lib/search/types.ts`)

```ts
export type SearchResultType = "case" | "blog" | "orgchart";
export type MatchRange = [number, number];

export interface SearchDocument {
  id: string; // z.B. "case:archegos:einordnung", "blog:<objectId>", "orgchart:<objectId>"
  type: SearchResultType;
  title: string;
  body: string; // vollständiger, HTML-freier Text – Grundlage für das Matching
  context?: string; // einordnende Angabe für die Anzeige (Fallname, Abteilung)
  path: string; // Pfad ohne Locale-Präfix, z.B. "/archegos", "/blogs/<id>", "/organigram"
  hash?: string; // Anker für Fälle (section.id)
  nodeId?: string; // Organigramm-Knoten-ID für ?node=<id>
  keywords?: string[]; // z.B. Blog-Tags
}

export interface SearchResultDTO {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string; // Textausschnitt rund um den Treffer
  context?: string;
  href: string; // fertiger Pfad inkl. #hash bzw. ?node=, weiterhin ohne Locale-Präfix
  score: number;
  titleMatches?: MatchRange[];
  snippetMatches?: MatchRange[];
}

// Bereiche ohne Sprachabhängigkeit ignorieren den Parameter schlicht.
export type SearchProvider = (locale: string) => Promise<SearchDocument[]>;
```

Zwei bewusste Verfeinerungen gegenüber dem ersten Entwurf:

- `**body` statt `snippet` im Dokument\*\*: Das Matching braucht den vollständigen Text, die Anzeige
  dagegen einen kurzen Ausschnitt. Würde man beides im selben Feld führen, würden die von Fuse.js
  gelieferten Trefferpositionen nicht mehr zum gekürzten Anzeigetext passen. Das Kürzen samt
  Umrechnung der Positionen passiert deshalb erst beim Mapping auf `SearchResultDTO` (Aufgabe C1).
- **Neues Feld** `context`: Abschnittstreffer heissen z. B. nur „Warnsignale"; ohne die Angabe des
  Falls wäre in der Trefferliste nicht erkennbar, ob der Abschnitt zu Archegos oder Greensill gehört.
  Beim Organigramm nimmt das Feld Funktion und Abteilung auf.

### 4.3 Provider

- **Fälle** (`providers/cases.ts`): Liest `messages/{locale}.json` (gleiche dynamische Import-Technik wie bereits in `i18n/request.ts`), iteriert über eine kleine `CASE_SLUGS`-Konstante (`["archegos", "greensill"]`) und erzeugt je Fall ein Übersichts-Dokument (Lead + Kernaussagen) sowie je Abschnitt ein eigenes Dokument, mit `hash: section.id` und dem Fallnamen als `context`. Ergebnis wird pro Locale in einer modulweiten `Map` zwischengespeichert (Inhalt ist statisch pro Deployment). Ergebnis: 21 Dokumente je Sprache (2 Übersichten + 19 Abschnitte).
- **Blogs** (`providers/blogs.ts`): Nutzt eine neue, kleine `unstable_cache`-Query (Projektion auf `id, title, excerpt, content, tags`, Cache-Tag `BLOG_LIST_TAG` aus `lib/cacheTags.ts` wiederverwendet, begrenzt auf 500 Beiträge), wandelt `content`/`excerpt` über `stripHtml()` (Wrapper um das bereits installierte `sanitize-html`, `allowedTags: []`) in reinen Text um.
- **Organigramm** (`providers/orgchart.ts`): Ruft die bestehende, bereits gecachte `getOrgChartEntries()` aus `lib/orgChart.ts` auf – keine neue Datenbank-Query nötig. `body` aus `roleTitle`, `department`, `description`; `nodeId` für den Deep-Link.
- **Registrierung** (`providers/index.ts`): `searchProviders`-Array plus `collectSearchDocuments(locale)`, das alle Provider parallel ausführt und die Dokumente zusammenführt. Ein vierter Inhaltsbereich wird ausschliesslich hier eingetragen.

### 4.4 Suchlogik (`lib/search/searchEngine.ts`)

Exportiert `searchContent(query, locale)` sowie die Konstanten `MIN_QUERY_LENGTH` (2) und `MAX_QUERY_LENGTH` (100).

- **Fuse.js-Konfiguration**: gewichtete Felder `title` (0.5) > `context` (0.15) = `keywords` (0.15) > `body` (0.2), `threshold: 0.35` für Tippfehlertoleranz, `minMatchCharLength: 2`, `includeMatches`/`includeScore` für Hervorhebung und Ranking. Wichtig ist `ignoreLocation: true` – ohne diese Option wertet Fuse.js Treffer, die weit hinten im Fliesstext stehen, stark ab, wodurch längere Abschnitte praktisch unauffindbar wären.
- **Ausgewogene Trefferliste**: maximal 8 Treffer, davon zunächst höchstens 4 je Inhaltsbereich; verbleibende Plätze werden anschliessend nach Relevanz aufgefüllt. Ohne diese Regel würden die 19 Fall-Abschnitte die Liste dominieren und Blog- oder Organigramm-Treffer verdrängen – fallen nur in einem Bereich Treffer an, bleiben trotzdem alle 8 Plätze nutzbar.
- **Snippet-Erzeugung**: Der Anzeige-Ausschnitt (160 Zeichen) wird um den ersten Treffer herum aus `body` geschnitten, an Wortgrenzen ausgerichtet, mit „…" markiert – und die von Fuse.js gelieferten Trefferpositionen werden auf diesen Ausschnitt umgerechnet, damit die Hervorhebung im gekürzten Text weiterhin stimmt.
- **Link-Aufbau**: `?node=<id>` für Organigramm, `#<section.id>` für Fall-Abschnitte, sonst der blosse Pfad – jeweils ohne Locale-Präfix.

Der Fuse-Index wird pro Anfrage aufgebaut. Bei der aktuellen Dokumentmenge (rund 40) ist das messbar unkritisch (siehe Messung unten); erst bei deutlich mehr Dokumenten lohnt ein vorberechneter Index.

### 4.5 API-Route (`app/api/search/route.ts`)

`GET /api/search?q=<begriff>&locale=<locale>`, im Stil von `app/api/org-chart/route.ts`:

- Zod-Schema validiert `q` (max. 100 Zeichen) und `locale` (Enum aus `routing.locales`, Fallback auf `defaultLocale`). Ungültige Parameter ergeben `400`.
- Eingaben unter 2 Zeichen (inkl. leerer Eingabe) liefern `200` mit leerer Trefferliste – das ist ein normaler UI-Zustand und kein Fehler.
- Antwortformat: `{ "results": SearchResultDTO[] }`.
- Nutzereingabe fliesst **nie** in eine Prisma-`where`-Klausel ein (es wird eine bereits validierte, gecachte Grundmenge geladen und ausschliesslich im Speicher mit Fuse.js gefiltert) – das erfüllt die Anforderung „keine ungeprüfte Weitergabe an die Datenbank" strukturell, nicht nur durch Validierung.
- `proxy.ts` schliesst `/api/*` bereits von der next-intl-Locale-Rewriting aus – die Route erhält die Sprache also explizit über den Query-Parameter, analog zur bestehenden Konvention.

### 4.6 Frontend (`components/search/SearchBox.tsx`)

Ersetzt das `<input>` in `navbar.tsx:94-100` (Klassen, `id="site-search"`, `aria-label`, Platzhalter bleiben erhalten). Funktionsumfang:

- Kontrollierter Input-State, Debounce (~250 ms), Abbruch veralteter Requests via `AbortController`.
- Ergebnis-Dropdown (kein UI-Baukasten vorhanden → eigenes `absolute`/`z-*`-Panel nach bestehendem Stil, angelehnt an das Overlay-Muster aus `components/ui/confirm-dialog.tsx`).
- Kategorie-Badge je Treffer (Wortwahl konsistent mit vorhandenen Begriffen: `navbar.case` = „Fall", `navbar.organigram`, „Blog").
- Hervorhebung der Treffer-Textstellen via `titleMatches`/`snippetMatches` (Wrapping in `<mark>`).
- Zustände: leere Eingabe (Dropdown zu), zu kurze Eingabe (Hinweistext), Laden, keine Treffer, Trefferliste.
- Tastaturbedienung: Pfeil-runter/-hoch bewegt die Auswahl, Enter navigiert zum aktiven Treffer, Escape schliesst das Dropdown.
- Barrierefreiheit: `role="combobox"` am Input, `aria-expanded`, `aria-controls`, `aria-activedescendant`; Ergebnisliste `role="listbox"`, Einträge `role="option"`; Live-Region für Trefferanzahl.
- Navigation über `Link`/`useRouter` aus `i18n/navigation.ts` (berücksichtigt `localePrefix: "as-needed"` automatisch).

### 4.7 Organigramm-Deep-Link (`OrganigramClient.tsx`)

Minimaler Eingriff: `useSearchParams()` (aus `next/navigation`) liest `?node=<id>` beim Laden aus und setzt – sobald die Baumdaten vorhanden sind – den bestehenden State `selectedNodeId` (Zeile 138) auf diesen Wert, wodurch sich das vorhandene Detail-Modal automatisch öffnet. Keine Änderung an der d3-org-chart-Integration selbst nötig.

### 4.8 Neue i18n-Keys

Neuer Namespace `search`, in allen 5 Sprachdateien zu ergänzen (Beispiel Deutsch):

```json
"search": {
  "category": { "case": "Fall", "blog": "Blog", "orgchart": "Organigramm" },
  "minLength": "Bitte mindestens 2 Zeichen eingeben.",
  "loading": "Suche läuft…",
  "noResults": "Keine Treffer für \"{query}\".",
  "resultsAnnouncement": "{count} Treffer gefunden.",
  "resultsListLabel": "Suchergebnisse"
}
```

Die bestehenden Keys `navbar.searchLabel`/`navbar.searchPlaceholder` bleiben unverändert.

### 4.9 Neue Abhängigkeit

`fuse.js` (per `npm install fuse.js`) – einzige neue Abhängigkeit für dieses Feature.

## 5. Aufgabenliste

- [x] **A1** `fuse.js` als Abhängigkeit hinzufügen (v7.5.0)
- [x] **A2** Ordnerstruktur `lib/search/` anlegen (`types.ts`, `textUtils.ts`, `providers/`)
- [x] **B1** Case-Provider: Fälle aus `messages/{locale}.json` lesen, in Dokumente (Übersicht + je Abschnitt) umwandeln, pro Locale cachen
- [x] **B2** Blog-Provider: neue gecachte, projizierte Prisma-Query + HTML-zu-Text-Bereinigung
- [x] **B3** Organigramm-Provider: bestehende `getOrgChartEntries()` auf Suchdokumente abbilden
- [x] **C1** Fuse.js-Suchlogik (Gewichtung, Schwellenwert, Highlighting-Mapping) in `lib/search/searchEngine.ts`
- [x] **C2** API-Route `GET /api/search` mit Zod-Validierung und Mindestlängen-Kurzschluss
- [ ] **D1** `components/search/SearchBox.tsx`: State, Debounce, Fetch mit Abbruch
- [ ] **D2** Ergebnis-Dropdown mit Kategorie-Badges, Hervorhebung, Leer-/Lade-/Kein-Treffer-Zuständen
- [ ] **D3** Tastaturnavigation + ARIA-Combobox/Listbox-Muster
- [ ] **D4** Einbindung in `navbar.tsx` anstelle des bisherigen `<input>`
- [ ] **E1** `OrganigramClient.tsx`: `?node=<id>` auslesen und Eintrag automatisch öffnen
- [ ] **F1** Neue i18n-Keys (`search`-Namespace) in allen 5 Sprachdateien ergänzen und übersetzen
- [ ] **G1** Manuelle Tests im Dev-Server (siehe Testplan)
- [ ] **G2** `npm run lint` und TypeScript-Check ohne neue Fehler
- [ ] **G3** Diese Dokumentation bei Bedarf finalisieren/ergänzen

## 6. Deliverables

1. **Funktionsfähige, integrierte Suchfunktion** gemäss Aufgabenliste A–E.
2. **Kurzdokumentation** – dieses Dokument (Konzept, Architekturentscheidungen, bekannte Einschränkungen).
3. **Kurzanleitung zu Abhängigkeiten/Konfiguration**: einzige zusätzliche Massnahme ist `npm install` (für `fuse.js`); keine neuen Umgebungsvariablen, keine Datenbank-Migration, kein Atlas-Search-Setup nötig. Hinweis zu i18nexus siehe unten.

## 7. Bekannte Einschränkungen

- **Blog-Tags**: Das Feld `tags` existiert im Schema, wird aber von keinem bestehenden Formular befüllt. Die Suche berücksichtigt es bereits, liefert dort aber vorerst keine Treffer – bewusst ausserhalb des Scopes dieser Ausschreibung (mit Auftraggeber abgestimmt).
- **In-Memory-Suche**: Bei der aktuellen Datenmenge (rund 37 Dokumente: 21 Fall-Dokumente je Sprache, 5 Blogbeiträge, 11 Organigramm-Einträge) mit 3–5 ms je Anfrage deutlich schnell genug. Bei deutlichem Wachstum (z. B. tausende Blogbeiträge) sollte auf datenbankseitige Indizierung (MongoDB Atlas Search) umgestellt werden.
- **Organigramm-Deep-Link**: Öffnet das passende Detail-Modal, zentriert den Baum aber nicht automatisch auf den Knoten (aus Aufwandsgründen nicht Teil des Scopes) – bei Bedarf später über die d3-org-chart-API nachrüstbar.
- **Fälle-Slugs**: Es existiert weiterhin keine zentrale Registry der Fallstudien (an 4 Stellen hart codiert: Navbar, Footer, Sitemap, Startseite); die Suche führt dafür lediglich eine eigene, minimale Konstante ein, behebt die bestehende Duplizierung aber nicht (separates Aufräumthema, ausserhalb des Scopes).
- **i18nexus**: `messages/*.json` werden laut `package.json` (`i18n:pull`) unter Umständen über den i18nexus-Dienst verwaltet. Neu ergänzte `search`-Keys sollten dort nachgezogen werden, damit sie bei einem künftigen Pull nicht überschrieben werden.
- **`npm run lint` und `ts-node` sind derzeit projektweit defekt** (bereits vor dieser Arbeit, durch das Upgrade auf TypeScript 7): `typescript-eslint` unterstützt TS 7.0 noch nicht (`Error: typescript-eslint does not support TS 7.0`), dieselbe Ursache legt auch das Script `create:admin` lahm. Als Qualitätssicherung dient deshalb `npx tsc --noEmit` (läuft fehlerfrei) zusammen mit den manuellen Tests. Sobald `typescript-eslint` TS 7 unterstützt bzw. auf TS 6 zurückgegangen wird, sollte Aufgabe G2 nachgeholt werden.

## 8. Testplan (manuell, da kein automatisierter Testlauf vorhanden ist)

- Deutsch, Suchbegriff aus einem Fälle-Abschnitt (z. B. „Warnsignale") → Treffer mit Link auf `/archegos#warnsignale`
- Sprache wechseln (z. B. Englisch), gleichen Abschnitt mit englischem Begriff suchen → nur Treffer in der aktiven Sprache
- Teil eines Blog-Titels eingeben → Treffer mit Link auf `/blogs/<id>`
- Name einer Person/Division aus dem Organigramm eingeben → Klick öffnet `/organigram?node=<id>` mit bereits geöffnetem Detail-Modal
- Bewusster Tippfehler (z. B. „Archegoz") → weiterhin Treffer dank Fuse.js-Toleranz
- Eingabe mit 1 Zeichen → Hinweistext statt Suchlauf
- Leere Eingabe → Dropdown geschlossen
- Suchbegriff ohne Treffer → „Keine Treffer"-Hinweis
- Tastaturbedienung: Pfeiltasten, Enter, Escape
- Stichprobe mit Screenreader: Ergebnisliste wird verständlich vorgelesen
- `npm run lint` und `npx tsc --noEmit` ohne neue Fehler

### Notizen zu der Implementierung A1-B3:

Zwei Dinge, die ich beim Implementieren angepasst und im Konzept dokumentiert habe:

1. Im Dokument heisst das Textfeld jetzt `body` (voller Text fürs Matching) statt `snippet`; der gekürzte Anzeige-Ausschnitt entsteht erst beim DTO-Mapping. Sonst würden die von Fuse.js gelieferten Trefferpositionen nicht mehr zum gekürzten Text passen. Zusätzlich gibt es ein Feld `context`, damit bei Abschnittstreffern wie „Warnsignale" erkennbar bleibt, zu welchem Fall sie gehören.
2. Beim HTML-Strippen klebten Absätze zusammen (`"WeltZweiter"`) – behoben durch Trennzeichen an den Tag-Grenzen.

### Notizen C1-C2

Die API-Route wurde im Dev-Server gegen die echte Datenbank getestet (22 Requests, keine Fehler im Server-Log). Datenbestand zum Testzeitpunkt: 21 Fall-Dokumente je Sprache, 5 Blogbeiträge, 11 Organigramm-Einträge – also rund 37 durchsuchbare Dokumente.

**Verifizierte Fälle**

| Szenario | Eingabe | Ergebnis |
| --- | --- | --- |
| Fall-Abschnitt (de) | `Warnsignale` | Treffer u. a. `/greensill#risiken` und `/archegos#warnsignale`, Hervorhebungsposition im Titel exakt auf dem Wort |
| Sprachabhängigkeit | `collapse` in de / en / fr | nur Englisch liefert die Fall-Treffer mit englischen Titeln; Deutsch und Französisch greifen erwartungsgemäss nicht auf englischen Text zu |
| Blog | `Transformation` | `/blogs/695bea1a…`, Snippet aus dem HTML-Inhalt sauber als reiner Text |
| Organigramm | `Investment Bank` | `/organigram?node=…`, Score 0.000 (exakter Treffer) |
| Tippfehler | `Archegoz` | findet weiterhin die Archegos-Abschnitte |
| Bereichsmischung | `Transformation` | Blog- und Organigramm-Treffer erscheinen gemeinsam in einer Liste |
| Kein Treffer | `xyzxyz123` | `200` mit leerer Liste |
| Zu kurz / leer | `a` bzw. `` | `200` mit leerer Liste, kein Suchlauf |
| Ungültige Sprache | `locale=xx` | `400` mit Zod-Fehlermeldung |
| Zu lange Eingabe | 150 Zeichen | `400` |
| Ohne `locale` | – | Fallback auf Deutsch, liefert Treffer |
| Injection-Versuch | `{"$ne":null}` | `200` mit leerer Liste – der Ausdruck erreicht nie eine Datenbankabfrage |

**Antwortzeiten**: warm 3.6–5.3 ms je Anfrage (erster Aufruf 1.4 s durch Kaltstart von Modulen, Datenbankverbindung und Cache-Aufbau). Die Anforderung „keine spürbaren Verzögerungen" ist damit serverseitig erfüllt.

**Erkenntnis aus dem Test**: Ohne die Begrenzung je Bereich belegten die 19 Fall-Abschnitte die Trefferliste nahezu vollständig. Die Regel „höchstens 4 je Bereich, danach nach Relevanz auffüllen" wurde deshalb eingeführt.

**Kein Fehler, sondern Quelldaten**: In einem Blog-Snippet erscheint `werden.Besonders` ohne Leerzeichen. Eine Prüfung des Rohinhalts hat gezeigt, dass das Leerzeichen bereits im gespeicherten Beitrag fehlt – die Textaufbereitung arbeitet korrekt.
