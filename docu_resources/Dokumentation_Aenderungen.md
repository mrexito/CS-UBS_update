# Dokumentation DIFA: Änderungen am Inhaltsverzeichnis

Vergleich von `Dokumentation_temp.docx` mit der Struktur der Arbeit von Künzli (Bestnote letztes Jahr).
Neue Punkte sind mit **NEU** markiert, erweiterte mit **ERGÄNZEN**. Alles andere bleibt wie im Entwurf.

## Vorgeschlagenes neues Inhaltsverzeichnis

```
Titelblatt                                                   NEU
Abstract                                                     NEU
Inhaltsverzeichnis                                           (final, mit Seitenzahlen)

1. Einleitung
   1.1 Projektkontext
   1.2 Zielsetzung und Überblick über die drei Aufgaben
   1.3 Abgrenzung                                            NEU
   1.4 Technologie-Stack vor Projektstart

2. Arbeitsweise und KI-Einsatz
   2.1 Vorgehen: Branches, Merge nach main
   2.2 Eingesetzte KI-Werkzeuge
   2.3 Prüfung der Resultate

3. Aufgabe 1: Aktualisierung der App
   3.1 Auftrag und Vorgehen
   3.2 Versionsübersicht vorher/nachher
   3.3 Test und Validierung                                  NEU
   3.4 Ergebnis (Screenshots der laufenden App)              NEU
   3.5 Prompt-Vergleich
   3.6 Selbstreflexion mit konkreten Herausforderungen       ERGÄNZEN

4. Aufgabe 2: Mehrsprachige Suchfunktion
   4.1 Auftrag und Anforderungen (funktional, nicht-funktional)
   4.2 Konzept: Datenfluss, einheitliches Dokumentenmodell
   4.3 Architektur (Diagramm)                                ERGÄNZEN
   4.4 Abhängigkeiten, Konfiguration, Betrieb
   4.5 Test und Qualitätssicherung
   4.6 Ergebnis (Screenshots der Suche)                      NEU
   4.7 Selbstreflexion mit konkreten Herausforderungen       ERGÄNZEN

5. Aufgabe 3: Themenbereich Regulatory Compliance
   5.1 Auftrag und Mockups
   5.2 Geklärte Fragen und Entscheidungen
   5.3 Umsetzung (Navigation, Übersicht, Platzhalter, Kapitel 7 mit Recharts, Übersetzungen)
   5.4 Vorgehen mit parallelen Agents
   5.5 Test und Review
   5.6 Ergebnis (Screenshots: Übersicht, Kapitel 7)          NEU
   5.7 Selbstreflexion mit konkreten Herausforderungen       ERGÄNZEN

6. Kritische Gesamtreflexion
   6.1 Lessons learned über alle drei Aufgaben
   6.2 Wo KI geholfen hat und wo sie Fehler eingebracht hat
   6.3 Was beim nächsten Mal anders gemacht würde

7. Fazit                                                     NEU
   (Kurze Zusammenfassung: Ziele erreicht? Wichtigste Aussage in 5 bis 8 Sätzen)

8. Ausblick                                                  NEU
   8.1 Verbesserungspotenzial
   8.2 Nächste Schritte

9. Deklaration                                               NEU
   9.1 Wortzahl
   9.2 Selbständigkeitserklärung
   9.3 Deklaration des KI-Einsatzes
   9.4 Quellenverzeichnis

10. Anhang
   A: Projektauftrag (Originaltext der drei Aufgaben)        NEU
   B: Anforderungstabelle (ID, Beschreibung, Herkunft im Auftrag)   NEU
   C: Verwendete Prompts Aufgabe 1
   D: Anleitung Next.js-Update auf 16.3.2
   E: Prompts und Plan Aufgabe 3
   F: Zugriff auf Code (Repository, Branches, Commits)       NEU
```

## Detail zu den neuen Punkten

| Punkt | Inhalt | Vorbild in Künzli |
|---|---|---|
| Titelblatt | Titel, Studiengang, Name, Experte, Abgabedatum | Seite 1 |
| Abstract | Ca. eine halbe Seite: Ausgangslage, Vorgehen, Resultat. Zuletzt schreiben. | Seite 2 |
| Abgrenzung | Was bewusst nicht Teil der Arbeit ist (z. B. keine produktive Einführung, keine echten Compliance-Inhalte, Platzhalter-Daten) | 1.2 |
| Test und Validierung (Aufgabe 1) | Wie geprüft wurde, dass nach dem Update alles läuft (Build, Lint, manuelle Prüfung der Seiten) | 2.5.4 |
| Ergebnis je Aufgabe | Screenshots plus 2 bis 3 Sätze, was zu sehen ist. Der Entwurf zeigt bisher nirgends das fertige Produkt. | 3.1 Prototyp |
| Herausforderungen | Konkrete Probleme mit Ursache und Lösung, nicht nur "was gut lief". Künzli widmet dem eine ganze Seite. | 5.1 |
| Fazit | Eigenes Kapitel, getrennt von der Gesamtreflexion | 4 |
| Ausblick | Was könnte verbessert oder erweitert werden | 6 |
| Deklaration | Wortzahl, Eigenständigkeit, KI-Einsatz (bei dieser Arbeit besonders wichtig) | 7 |
| Quellenverzeichnis | Next.js-, Prisma-, Recharts- und Such-Dokumentation, verwendete KI-Modelle | 7.1 |
| Projektauftrag | Originaltext der Aufgaben, auf den sich die Anforderungen beziehen | Anhang a |
| Anforderungstabelle | Tabelle F1, F2, ... N1, N2 ... mit Spalte "Herkunft im Auftrag" (Zitat) | Anhang b |
| Zugriff auf Code | Repo-Link, relevante Branches (`upgrade/next16-prisma7`, `search-feature`, `rc/*`), Startanleitung | Anhang c |

## Was bewusst bleibt (Stärken gegenüber Künzli)

- Kapitel "Arbeitsweise und KI-Einsatz" und der Prompt-Vergleich: bei Künzli nicht vorhanden, passen aber zum Thema dieses Jahres.
- Vorgehen mit parallelen Agents und die Anhänge mit Prompts: zeigen Nachvollziehbarkeit.

## Empfohlene Reihenfolge beim Schreiben

1. Anforderungstabelle und Projektauftrag (Anhang), da sie die Basis für alles andere sind
2. Ergebnis-Abschnitte mit Screenshots
3. Herausforderungen in den Selbstreflexionen
4. Fazit und Ausblick
5. Abgrenzung
6. Deklaration und Quellen
7. Abstract, Titelblatt, Inhaltsverzeichnis zuletzt
