# Review: Regulatory Compliance Feature (CS-UBS_update)

## Übersicht des Implementierungsstandes

Das Feature „Regulatory Compliance“ wurde erfolgreich implementiert als neuer Themenbereich mit:

- **Navigation** (2. Pill-Reihe unter `/regulatory-compliance/`\*)
- **Übersichtsseite** (`/regulatory-compliance` mit 5 Karten + Storyline)
- **Kapitalquoten-Seite** (`/regulatory-compliance/capital-ratios` mit Charts & Tabellen)
- **Platzhalter-Seiten** (`/regulatory-compliance/[topic]` für die 4 noch leeren Themen)
- **Sitemap & Suche** (neuer Suchprovider `regulatoryCompliance`)
- **Übersetzungen** (de/en/fr/es/it)

---

## ✅ Stärken der Implementierung

1. **Modulare Architektur** – Recharts-Chart und Tabellen sind als wiederverwendbare Komponenten (`RatioChart`, `RatioTable`) aufgebaut.
2. **SEO-fokussiert** – `generateMetadata`, `alternates`, `revalidate = 3600` sind korrekt umgesetzt.
3. **Suchfunktion** – Der neue Provider generiert Documents für Übersicht, Topics und die beiden Kapitel-7-Abschnitte (mit Sprungmarken `#rwa`, `#leverage`).
4. **Testabdeckung** – 3 neue Suchtests (T21, T22, T23) prüfen CET1-Search, Thema-Suche und Sprungmarken.
5. **Schweizer Schreibweise** – Essetz in Texten ist vermieden (z.B. „Massnahmen“, „massgeblich“).
6. **Typsicherheit** – `CapitalRatioRow`, `RC_CAPITAL_RATIOS_ANCHORS` sind gut typisiert.

---

## ⚠️ Kritische Issues & Potenzielle Bugs

### 1. `lib/regulatoryCompliance.ts` **– fehlende** `RC_CAPITAL_RATIOS_ANCHORS` **Import**

Die Kapitel-7-Seite (`capital-ratios/page.tsx`) importiert `RC_CAPITAL_RATIOS_ANCHORS` von `@/lib/regulatoryCompliance`, aber die Datei `regulatoryCompliance.ts` enthält **nur** `RC_BASE_PATH` und `RC_TOPICS`:

```ts
// regulatoryCompliance.ts – ACTUELLE INHALT:
export const RC_BASE_PATH = "/regulatory-compliance";
export const RC_TOPICS = [...];

// ABER capital-ratios/page.tsx importiert:
import { RC_BASE_PATH, RC_CAPITAL_RATIOS_ANCHORS, RC_TOPICS } from "@/lib/regulatoryCompliance";
```

**Problem:** Der Import `RC_CAPITAL_RATIOS_ANCHORS` wird **nicht gefunden**. Die Datei müsste entweder:

- `RC_CAPITAL_RATIOS_ANCHORS` direkt in `regulatoryCompliance.ts` exportieren, **oder**
- Der Import muss auf `@/lib/regulatoryCompliance/capitalRatios` zeigen (wobei der Import im `capitalRatios/page.tsx` dann nicht funktioniert, da es kein `RC_CAPITAL_RATIOS_ANCHORS` dort gibt).

**Empfehlung:** Füge `RC_CAPITAL_RATIOS_ANCHORS` in `regulatoryCompliance.ts` hinzu:

```ts
export const RC_CAPITAL_RATIOS_ANCHORS = {
  rwa: "rwa",
  leverage: "leverage",
} as const;
```

---

### 2. `RatioChart.tsx` **–** `label` **mit inline SVG kann zu Performance-Problemen führen**

Der Chart-Label-Code:

```ts
label={(props) => { ... return (<g><circle ... /><text ... /></g>); }}
```

**Problem:** Recharts ruft diese Funktion für **jeden Tick** auf (auch bei Hover-Interaktionen). Inline-SVGs als Return-Wert sind problematisch. Besser: `dot` mit `className` und ein eigenes `Label`-Element außerhalb des Charts.

**Empfehlung:** Das Label als separaten `g`-Gruppierung im Chart verwenden, aber die Funktion so beschreiben, dass sie nur einmal pro Datenpunkt zurückgibt:

```ts
// Stattdessen mit einem stabilen Label-Objekt:
const dot = {
  r: 5,
  fill: actualColor,
};

const label = {
  formatter: (value) => formatPercent(value),
  position: "right",
};
```

---

### 3. `RatioTable.tsx` **–** `tabular-nums` **auf allen Zellen, nicht nur Daten**

```tsx
{
  VALUE_KEYS.map((key) => (
    <td key={key} className="px-6 py-3 tabular-nums">
      {formatValue(row[key])}
    </td>
  ));
}
```

**Problem:** `tabular-nums` ist korrekt auf die Daten-Zellen. Das ist OK.

Allerdings: Die **Header-Zellen** haben keine `tabular-nums` und die Zeilen sind nicht korrekt als Daten-Zellen markiert. Dies ist akzeptabel, aber die `caption` sollte auch mit `tabular-nums` für Konsistenz.

---

### 4. `lib/search/providers/regulatoryCompliance.ts` **– Cache pro Locale, aber kein Clear**

```ts
const documentsByLocale = new Map<string, SearchDocument[]>();
```

**Problem:** Der Cache wird **niemals gelöst**. Bei Änderungen der Messages (z.B. nach Phase 3 Integration) bleibt alte Daten im Cache.

**Empfehlung:** Ein `clearCache()`-Export oder ein globaler Cache, der bei Änderungen neu geladen wird. Alternativ: Kein lokaler Map-Cache, sondern immer frische Daten laden (die Messages-Dateien sind klein).

---

### 5. `app/[locale]/regulatory-compliance/[topic]/page.tsx` **–** `dynamicParams = false`**, aber keine Validierung**

```ts
export const dynamicParams = false;

function findPlaceholderTopic(slug: string) {
  return RC_TOPICS.find((topic) => topic.slug === slug && !topic.hasContent);
}

export default async function RegulatoryCompliancePlaceholderPage({ params }) {
  const topic = findPlaceholderTopic(slug);
  if (!topic) notFound();
```

**Problem:** `notFound()` wird nur aufgerufen, wenn kein Platzhalter-Topic gefunden wird. Aber was passiert bei einem **unbekannten Slug**, der nicht in `RC_TOPICS` ist? Die Funktion zurückgibt `undefined`, und `notFound()` wird korrekt ausgelöst.

**Allerdings:** Die SEO-Metadaten werden auch für `notFound()` generiert:

```ts
export async function generateMetadata({ params }) {
  const topic = findPlaceholderTopic(slug);
  if (!topic) return {}; // ← OK, keine Metadaten bei 404
```

Dies ist korrektes Verhalten. **Kein Issue hier.**

---

### 6. `app/sitemap.ts` **–** `staticPaths` **enthält locale-prefixed Pfade, aber** `localizePath()` **dupliziert sie**

```ts
const staticPaths = ["/", "/about", ...];

function localizePath(path: string, locale: string): string {
  // ...
}

const staticEntries = routing.locales.flatMap((locale) =>
  staticPaths.map((path) => ({
    url: safeJoinUrl(baseUrl, localizePath(path, locale)),
  }))
);
```

**Problem:** `RC_BASE_PATH` wird in `staticPaths` **ohne Locale-Prefix** hinzugefügt. Die Funktion `localizePath()` fügt dann `/${locale}` hinzu. Das ergibt z.B. `/en/regulatory-compliance`.

**Allerdings:** `localizePath("/")` gibt `/${locale}` zurück, und `safeJoinUrl(baseUrl, "/en/regulatory-compliance")` ergibt `https://example.com/en/regulatory-compliance`. Das ist korrekt.

**Kein Issue hier.** Die Sitemap-Struktur sieht gut aus.

---

### 7. `components/navbar.tsx` **–** `normalizedPath` **Berechnung kann zu falschen** `startsWith()` **Ergebnissen führen**

```ts
const normalizedPath = useMemo(() => {
  if (!pathname) return "/";
  if (locale) {
    const localePrefix = `/${locale}`;
    if (pathname === localePrefix) return "/";
    if (pathname.startsWith(`${localePrefix}/`)) {
      const trimmed = pathname.slice(localePrefix.length);
      return trimmed.length > 0 ? trimmed : "/";
    }
  }
  return pathname.length > 0 ? pathname : "/";
}, [locale, pathname]);

// Unter-Navigation:
const isRcSection =
  normalizedPath === RC_BASE_PATH ||
  normalizedPath.startsWith(`${RC_BASE_PATH}/`);
```

**Problem:** Wenn `pathname === "/"` (Startseite), wird `normalizedPath` zu `"/"`. Da `RC_BASE_PATH === "/regulatory-compliance"`, ist `normalizedPath === RC_BASE_PATH` **false** und `startsWith` auch **false**. Das ist korrekt.

Aber: Wenn `pathname === "/en"` (Startseite in English), wird `normalizedPath` zu `"/"`. Auch hier ist `isRcSection === false`. **OK.**

**Allerdings:** Bei `pathname === "/en/regulatory-compliance"` wird `trimmed = "regulatory-compliance"`, und `normalizedPath === "/regulatory-compliance"` (wobei das Slash fehlt!).

**BUG:** `normalizedPath` wird auf `"regulatory-compliance"` (ohne Leading-Slash) reduziert, wenn `trimmed.length > 0`. Der Vergleich `normalizedPath === RC_BASE_PATH` (`"/regulatory-compliance"`) ist also **falsch**!

**Empfehlung:** `normalizedPath` sollte immer mit Leading-Slash beginnen:

```ts
return trimmed.length > 0 ? "/" + trimmed : "/";
```

Oder: `RC_BASE_PATH` ohne Leading-Slash in der Variablen verwenden.

---

### 8. `app/[locale]/regulatory-compliance/page.tsx` **– ArrowIcon als Inline-SVG im React-Code**

```tsx
function ArrowIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ...>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
```

**Problem:** Inline-SVGs sind korrekt. **Kein Issue.**

Allerdings: Die SVG hat kein `aria-hidden` auf dem `<svg>`-Element selbst, nur implizit durch das Content. Das ist akzeptabel, aber für Screenreader wäre ein `role="img"` und `aria-label` besser.

---

### 9. `app/[locale]/regulatory-compliance/capital-ratios/page.tsx` **–** `keyTakeaways` **als** `string[]` **ohne Typisierung**

```ts
const keyTakeaways = t.raw("capitalRatios.keyTakeaways") as string[];
```

**Problem:** `t.raw()` gibt `unknown` zurück. Das Casten auf `string[]` ist sicher, da die Messages-Datei es als `string[]` definiert. Allerdings ist das eine **unsichere Annahme** – falls der Key fehlt, wird `undefined` als Array interpretiert (was zu einem Fehler bei `.map()` führt).

**Empfehlung:**

```ts
const keyTakeaways = t.raw("capitalRatios.keyTakeaways") ?? [];
```

---

### 10. `lib/regulatoryCompliance/capitalRatios.ts` **–** `Q2 2023` **Leverage-Werte sind alle** `null`**, aber** `Q1 2023` **hat nur CET1**

```ts
{ quarter: "Q1 2023", cet1: 7.56, target: null, goingConcern: null, goneConcern: null, tlac: null },
{ quarter: "Q2 2023", cet1: null, target: null, goingConcern: null, goneConcern: null, tlac: null },
```

**Problem:** In der `RatioTable.tsx` wird `formatValue(null)` zu `"–"` umgewandelt. Das ist korrekt.

Allerdings: Der `RatioChart` nutzt `connectNulls`, also werden Lücken mit einer Linie verbunden. Bei Q1 2023 fehlt `target`, also ist die Zielwert-Linie nach Q4 2022 unterbrochen. Das ist **gewollt** (je nach Planung), aber sollte im Mockup bestätigt sein.

---

### 11. `messages/de.json`**,** `en.json`**, etc. – fehlende Übersetzungen für** `reference.lines`

```json
"reference": {
  "title": "Quellenangabe",
  "lines": [
    "TODO: Quellenangabe für Kapitel 7 (Bachelorarbeit, CS-Geschäftsberichte, FINMA) ergänzen."
  ]
}
```

**Problem:** Alle 5 Sprachen haben **denselben TODO-Text**. Das ist korrekt als Platzhalter, aber in den Testreports sollte dieser Punkt explizit als offener Issue erwähnt werden.

---

### 12. `tests/search-api.test.mjs` **–** `TERMS.rcTerm` **und** `TERMS.rcTopic` **nicht definiert**

```js
it("T21 – CET1 liefert die Kapitalquoten-Seite", async () => {
  const { status, results } = await search(TERMS.rcTerm, "de");
```

**Problem:** Die Datei `tests/search-api.test.mjs` enthält **keine Definitionen für** `TERMS.rcTerm` und `TERMS.rcTopic`. Diese müssen definiert sein:

```js
const TERMS = {
  rcTerm: "CET1",
  rcTopic: "Kapitalquoten",
};
```

Wenn diese Definition fehlt, wird der Test mit `undefined` laufen und scheitern. **Kritisch!**

---

### 13. `app/sitemap.ts` **–** `prisma.blogPost.findMany()` **kann langsam sein**

```ts
const blogPosts = await prisma.blogPost.findMany({
  select: { id: true, updatedAt: true },
});
```

**Problem:** Dies ist ein einzelner DB-Call, der in der Sitemap-Generierung läuft. Für kleine Blog-Architekturen ist das OK, aber bei vielen Blogs sollte ein Cache oder `findMany({ take: 100 })` verwendet werden.

**Empfehlung:** Kein Issue bei aktualem Umfang, aber für Skalierbarkeit ein Cache oder Limit setzen.

---

## 📝 Zusammenfassung der kritischen Probleme (Priorität)

| #   | Problem                                                         | Priority                                            | File                                             |
| --- | --------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| 1   | `RC_CAPITAL_RATIOS_ANCHORS` nicht in `regulatoryCompliance.ts`  | **Kritisch** – Code wird nicht laufen               | `lib/regulatoryCompliance.ts`                    |
| 2   | `normalizedPath` missing Leading-Slash bei locale-prefixed URLs | **Kritisch** – Navigation funktioniert falsch       | `components/navbar.tsx`                          |
| 3   | `TERMS.rcTerm` nicht definiert im Test                          | **Kritisch** – Tests scheitern                      | `tests/search-api.test.mjs`                      |
| 4   | Cache in `regulatoryCompliance.ts` hat kein Clear               | **Medium** – alte Daten bleiben zwischengespeichert | `lib/search/providers/regulatoryCompliance.ts`   |
| 5   | `keyTakeaways` ohne Null-Check auf `t.raw()`                    | **Medium** – Fehler bei fehlendem Key               | `capital-ratios/page.tsx`                        |
| 6   | Inline SVG Label im RatioChart kann performanzkritisch sein     | **Niedrig** – nur bei vielen Datenpunkten relevant  | `components/regulatoryCompliance/RatioChart.tsx` |

---

## ✅ Empfehlungen für Phase 3 (Integration)

1. **Führe die oben genannten Korrekturen durch** – besonders #1, #2 und #3 sind Blocker.
2. **Quellenangabe für Kapitel 7 liefern** – der TODO sollte durch echte Quellen ersetzt werden.
3. **Q4-2022 Werte aus Tabelle 6 verifizieren** – der Mockup ist abgeschnitten, die abgelesenen Werte sollten mit der Quelle bestätigt werden.
4. **Übersetzungen fr/es/it überprüfen** – ob sie korrekt sind oder ob i18nexus-Pull genutzt werden soll.
5. `npm run lint`**,** `npx tsc --noEmit`**,** `npm run test:search` **laufen** – alle Tests müssen grün sein.
6. **Manuelle Prüfung:**
   - Zweite Pill-Reihe erscheint nur unter `/regulatory-compliance/*` (auch mit Locale-Prefix)
   - Charts und Tabellen in Light/Dark Mode, Mobile-Breite ohne horizontales Scrollen der Seite
   - Sprachwechsel funktioniert auf allen neuen Seiten
   - `/sitemap.xml` enthält die 6 neuen Pfade pro Locale

---

_Review erstellt am 2026-12-18. Alle Pfade basieren auf dem Dateisystem von_ `CS-UBS_update`_._
