# Manuelle Testfälle: Regulatory Compliance

**Vorbereitung:** `npm run dev` starten und `http://localhost:3000/de` öffnen. Bei den Testfällen mit Sprachwechsel oder Dark Mode die Sprache und das Theme über die Seitenleiste umstellen.

Ergebnis pro Testfall: [ ] OK / [ ] Fehler (Notiz)

## TC1: Hauptnavigation

1. Auf der Startseite die obere Pill-Reihe ansehen.
2. Die Reihenfolge prüfen: Blogs, Archegos, Greensill, **Regulatory Compliance**, dann die restlichen Einträge.
3. Auf **Regulatory Compliance** klicken.

**Erwartet:**

- Die URL ist `/de/regulatory-compliance`.
- Die Pill ist aktiv (blau).
- Unter der Hauptnavigation erscheint eine zweite Pill-Reihe mit dem Label "REGULATORY COMPLIANCE — THEMEN".
- Die zweite Reihe hat 5 Pills: Kapitalquoten, Liquidität, Krise & Marktvertrauen, Regulatorische Massnahmen, AT1-Instrumente.
- Keine der 5 Unter-Pills ist aktiv.

## TC2: Zweite Pill-Reihe nur im Themenbereich

1. Auf **Blogs**, **Archegos** und **Über uns** klicken.
2. Zurück zu **Regulatory Compliance** und dann auf die Unter-Pill **Liquidität** klicken.

**Erwartet:**

- Auf den anderen Seiten gibt es keine zweite Pill-Reihe.
- Auf Liquidität ist die Haupt-Pill "Regulatory Compliance" weiterhin aktiv.
- Zusätzlich ist die Unter-Pill "Liquidität" aktiv und sonst keine.

## TC3: Übersichtsseite

1. `/de/regulatory-compliance` öffnen und mit `image006.png` vergleichen.
2. Den Header prüfen: Eyebrow "FALLSTUDIE · BACHELORARBEIT", H1 und Lead-Text.
3. Alle 5 Karten ansehen und mit der Maus darüberfahren.
4. Die Storyline-Kachel und die Ablauf-Leiste ansehen.

**Erwartet:**

- Es gibt 5 Karten und eine dunkle Storyline-Kachel ohne Link.
- Bei Kapitalquoten sind Punkt und Pfeil blau, bei den anderen grau.
- Beim Hover ändern sich der Pfeil und die Karte sichtbar.
- Die Ablauf-Leiste zeigt Kapital → Liquidität → Krise → Massnahmen → AT1, "Kapital" ist blau hervorgehoben.

## TC4: Links der Karten und der Ablauf-Leiste

1. Jede der 5 Karten anklicken und jeweils zurück navigieren.
2. Jeden Eintrag der Ablauf-Leiste anklicken.

**Erwartet:**

- Jeder Link führt zur richtigen Unterseite: `/capital-ratios`, `/liquidity`, `/crisis-market-confidence`, `/regulatory-measures`, `/at1-instruments`.
- Die richtige Unter-Pill ist jeweils aktiv.

## TC5: Platzhalterseiten

1. Die vier Seiten Liquidität, Krise & Marktvertrauen, Regulatorische Massnahmen und AT1-Instrumente öffnen.
2. Den Link "‹ Regulatory Compliance" anklicken.
3. `/de/regulatory-compliance/foo` aufrufen.

**Erwartet:**

- Jede Seite zeigt Eyebrow, Titel und "Inhalt folgt". Zusätzlich steht die Themenbeschreibung als Lead-Text da (Ergänzung von Track B, siehe offene Frage unten).
- Der Zurück-Link führt zur Übersicht.
- `/foo` zeigt die 404-Seite.

## TC6: Kapitel 7, Aufbau

1. `/de/regulatory-compliance/capital-ratios` öffnen und mit `image007.png` vergleichen.
2. Von oben nach unten prüfen: Zurück-Link, Eyebrow "KAPITEL 7 · CAPITAL COMPLIANCE ANALYSIS", H1, Lead, Box "KERNAUSSAGEN" mit 3 Punkten.
3. Abschnitt 7.1: Intro, Chart, Tabelle 5.
4. Abschnitt 7.2: Intro, Chart, Tabelle 6.
5. Ganz unten die Quellenangabe und den Weiter-Link "Liquidität →" ansehen.

**Erwartet:**

- Alle Bausteine sind vorhanden und in dieser Reihenfolge.
- Die Quellenangabe zeigt nur den TODO-Platzhalter (bekannt).
- Der Weiter-Link führt zur Liquiditäts-Seite.

## TC7: Charts

1. Im Chart 7.1 mit der Maus über die Punkte fahren (Tooltip).
2. Dasselbe im Chart 7.2 tun.
3. Die Legende oben rechts prüfen.

**Erwartet:**

- Die Ist-Linie ist durchgezogen (7.1 blau, 7.2 grün), die Zielwert-Linie grau und gestrichelt.
- Am höchsten Punkt steht ein Label (7.1: 20.26%).
- Der Tooltip zeigt die Werte des jeweiligen Quartals.
- Die Charts zeigen 4 Datenpunkte (Auszug).
- Im Chart 7.2 sind die fehlenden Werte von Q2 2023 ohne Lücke oder Fehler überbrückt.

## TC8: Tabellen

1. Tabelle 5 mit diesen Werten vergleichen:

   | Quartal | CET1  | Ziel CET1 | Going Concern | Gone Concern | TLAC  |
   | ------- | ----- | --------- | ------------- | ------------ | ----- |
   | Q1 2019 | 12.53 | 9.97      | 17.35         | 12.54        | 29.89 |
   | Q4 2022 | 14.06 | 9.60      | 19.93         | 19.57        | 39.51 |
   | Q1 2023 | 20.26 | 9.64      | 20.26         | 19.89        | 40.15 |
   | Q2 2023 | 14.40 | 10.60     | 17.00         | 16.00        | 33.00 |

2. Tabelle 6 mit diesen Werten vergleichen:

   | Quartal | CET1 Lev. | Ziel | Going Concern | Gone Concern | TLAC  |
   | ------- | --------- | ---- | ------------- | ------------ | ----- |
   | Q1 2019 | 4.04      | 3.20 | 5.59          | 4.04         | 9.64  |
   | Q4 2022 | 5.42      | 3.25 | 7.69          | 7.55         | 15.24 |
   | Q1 2023 | 7.56      | –    | –             | –            | –     |
   | Q2 2023 | –         | –    | –             | –            | –     |

3. Die Q4-2022-Zeile von Tabelle 6 mit der Originalquelle abgleichen (abgelesener Wert, noch ungeprüft).

**Erwartet:**

- Zahlen mit 2 Nachkommastellen, fehlende Werte als "–".
- Das `<caption>` steht über jeder Tabelle.

## TC9: Anker und Suche

1. `/de/regulatory-compliance/capital-ratios#leverage` direkt aufrufen.
2. Die Suche (Lupe oben) öffnen und "CET1" eingeben, dann "Kapitalquoten" und danach "Liquidität".
3. Auf das Treffer-Ergebnis für Abschnitt 7.1 klicken.

**Erwartet:**

- Die Seite scrollt zu Abschnitt 7.2, die Überschrift ist nicht unter der Navbar versteckt.
- Es erscheinen Treffer der Kategorie "Regulatory Compliance".
- Der Treffer 7.1 führt zu `…/capital-ratios#rwa` und scrollt zum richtigen Abschnitt.
- Die Suche nach "Liquidität" findet die Platzhalterseite.

## TC10: Sprachen

1. Die Sprache auf EN, FR, ES und IT umstellen, jeweils auf Übersicht, Kapitalquoten und einer Platzhalterseite.
2. Prüfen, dass die URL den Locale-Prefix behält (`/en/regulatory-compliance/...`).

**Erwartet:**

- Texte, Karten, Tabellen-Spaltenköpfe, Chart-Titel, Pill-Reihe und Suchkategorie sind übersetzt.
- Es bleibt kein deutscher Text stehen, ausser dem TODO bei der Quellenangabe, soweit er dort so übersetzt wurde.
- Die zweite Pill-Reihe erscheint auch mit Prefix, und die richtige Pill ist aktiv.
- Fachbegriffe (CET1, TLAC, Going Concern, AT1, RWA, FINMA) bleiben unübersetzt.

## TC11: Dark Mode

1. Das Theme auf Dark umschalten und Übersicht und Kapitalquoten ansehen.

**Erwartet:**

- Alle Texte sind lesbar.
- Die Storyline-Kachel bleibt dunkel und kontrastreich.
- Linien, Gitter, Achsen und Tooltip der Charts sind erkennbar.
- Die Tabellen haben sichtbare Trennlinien.

## TC12: Mobile

1. Die Browserbreite auf etwa 375 px verkleinern (DevTools, Geräte-Modus).
2. Übersicht, Kapitalquoten und die Pill-Reihen ansehen.

**Erwartet:**

- Die Seite scrollt nicht horizontal.
- Die Karten stehen untereinander.
- Die Tabellen scrollen nur innerhalb ihres Rahmens.
- Die Charts passen sich der Breite an.
- Die Pill-Reihen brechen sauber um oder lassen sich scrollen.

## TC13: Sitemap und Direktaufrufe

1. `http://localhost:3000/sitemap.xml` öffnen und nach "regulatory" suchen.
2. Eine Unterseite per Direktaufruf laden, zum Beispiel `/en/regulatory-compliance/at1-instruments`, und die Seite neu laden (F5).

**Erwartet:**

- 30 Einträge: 6 Pfade (die Übersicht plus 5 Themen) in je 5 Sprachen.
- Die Direktaufrufe laden ohne Fehler, auch nach dem Neuladen.

## Offene Frage

Der Plan sah für die Platzhalter nur Titel und "Inhalt folgt" vor. Die Beschreibung als Lead-Text ist eine Ergänzung von Track B (TC5). Entscheiden, ob sie bleiben soll.
