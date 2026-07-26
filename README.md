# CS · UBS · Fusion — Platform Overview
# Projekt starten (wichtig)

> Ohne gültige `.env` lässt sich die Anwendung nicht starten. Die Datei ist absichtlich nicht im Repository. Sie können das Repo klonen; die benötigte `.env` sende ich separat. API-Keys, DB-URL, Auth-Secrets etc. sind zwingend.
## Quickstart (lokal)

Voraussetzungen:
- Node.js ≥ 18 (empfohlen) und npm (packageManager: npm@11.6.1)
- Git

Schritte:
1. Repository klonen  
    ```bash
    git clone https://github.com/gomec1/cs_ubs_fusion.git
2. Abhängigkeiten installieren  
    ```bash
    npm install
3. `.env` bereitstellen  
    - Die Datei kommt separat von mir (kein `.env.example` im Repo).
    - Enthält u. a. Datenbank-URL, Auth-Secrets, OAuth-Provider, Cloudinary.
4. Entwicklung starten  
    ```bash
    npm run dev   # Next.js mit Turbopack unter http://localhost:3000
5. (Optional) Build prüfen  
    ```bash
    npm run build
6. (Optional) Produktionsstart nach Build  
    ```bash
    npm start
7. (Optional) Linting  
    ```bash
    npm run lint
---

## Inhalt

- [Überblick](#überblick)
- [Projektstruktur](#projektstruktur)
- [Technologie-Stack](#technologie-stack)
- [Funktionen](#funktionen)
- [Konfiguration / Umgebungsvariablen](#konfiguration--umgebungsvariablen)
- [Scripts & Commands](#scripts--commands)
- [Deployment](#deployment)
- [Kontext](#kontext)
- [Lizenz & Disclaimer](#lizenz--disclaimer)

## Überblick
Webplattform zur Dokumentation und Diskussion der Credit Suisse–UBS-Fusion sowie der Fallstudien Archegos/Greensill. Enthält Blogs, Organigramm, rollenbasierten Zugang und Mehrsprachigkeit. Einzelprojekt im Studiengang Wirtschaftsinformatik (BFH); sicherer Login für Beitragende.

## Projektstruktur
- [app](app) — Next.js App Router (Layouts, Seiten, Routen, Server Actions); inkl. lokalisierter Routen ([app/[locale]](app/%5Blocale%5D)).
- [components](components) — UI-Bausteine (Navbar, Footer, Auth-Buttons, Blog-UI, shadcn/ui-basierte Inputs/Buttons).
- [lib](lib) — Hilfsfunktionen: Prisma-Client, Auth/Password-Helpers, Org-Chart-Logik, Caching/SEO, Sanitizer.
- [i18n](i18n) & [messages](messages) — next-intl Routing/Navigation, Lokalisierungsdateien (DE/EN/FR/IT/ES).
- [prisma](prisma) — [schema.prisma](prisma/schema.prisma) für MongoDB; Models für User, Blogs, Kommentare, Reaktionen, Org-Chart.
- [public](public) — statische Assets.
- [scripts](scripts) — z. B. [create-admin.ts](scripts/create-admin.ts) zum Anlegen eines Admin-Users.
- [middleware.ts](middleware.ts) — Locale-Handling, ggf. Auth-Routing.
- [eslint.config.mjs](eslint.config.mjs), [tailwind.config.ts](tailwind.config.ts), [tsconfig.json](tsconfig.json) — Tooling/Build-Konfiguration.

## Technologie-Stack
- Framework: Next.js 15 (App Router, SSR/ISR) mit React 19, TypeScript.
- Styling: Tailwind CSS 4, tailwindcss-animate; eigene Komponenten (shadcn/ui-Stil) unter [components/ui](components/ui).
- Auth: next-auth (Credentials + OAuth, Google u. a.), Adapter: @auth/prisma-adapter.
- DB/ORM: MongoDB mit Prisma Client; Password-Hashing via bcryptjs.
- Internationalisierung: next-intl, Inhalte gepflegt via i18nexus (CLI).
- Media: Cloudinary (next-cloudinary) für signierte Uploads.
- Rich Text: Quill (mit Image-Resize-Plugin) + sanitize-html für sichere Inhalte.
- Visualisierung: d3/d3-org-chart für Organigramm.
- Validation: zod.
- Utilities: jsonwebtoken, react-hot-toast.
- Tooling: ESLint 9 (eslint-config-next), TypeScript 5, Turbopack, concurrently (Dev mit i18nexus), Tailwind/PostCSS/Autoprefixer.

## Funktionen
- Authentifizierung & Rollen: Login/Registration (Credentials + OAuth), Rollen USER/ADMIN/EDITOR für geschützte Aktionen.
- Blog-Modul: Erstellen/Bearbeiten/Löschen (rollen- und besitzergesteuert), Reaktionen (Like/Dislike), Kommentare, Bild-Uploads via Cloudinary.
- Organigramm: Interaktives Org-Chart (d3-org-chart), Hinzufügen/Entfernen von Einträgen, Validierung von Hierarchien.
- Mehrsprachigkeit: Locale-Routing, Übersetzungen in DE/EN/FR/IT/ES.
- SEO & Auslieferung: SSR/ISR, Sitemaps/Robots, Metadaten-Helpers.
- UI/UX: Light/Dark-Mode, wiederverwendbare Layout-Sektionen, Toast-Feedback.

## Konfiguration / Umgebungsvariablen
- `.env` ist verpflichtend und wird separat bereitgestellt (nicht im Repo). Secrets niemals committen.
- Typische Variablen (aus dem Code abgeleitet):
    - Datenbank: `DATABASE_URL` (MongoDB)
    - Auth: `AUTH_SECRET`, OAuth-Provider (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, ggf. weitere)
    - Storage: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    - App/Host: ggf. `NEXTAUTH_URL`, `NEXT_PUBLIC_*` für öffentliche Keys/Endpoints
- Falls eine `.env.example` ergänzt wird, daraus kopieren und lokal zu `.env.local` oder `.env` machen.

## Scripts & Commands
| Script | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server mit Turbopack starten (http://localhost:3000). |
| `npm run devnexus` | Dev-Server + i18nexus-Live-Sync parallel (concurrently). |
| `npm run build` | Produktionsbuild (Turbopack). |
| `npm start` | Startet den gebauten Server. |
| `npm run lint` | ESLint-Check. |
| `npm run i18n:pull` | Übersetzungen via i18nexus ziehen. |
| `npm run create:admin` | Admin-User per Script anlegen (ts-node). |

## Deployment
- Standard Next.js Deployment möglich (z. B. Vercel oder eigener Node-Host).
- Erforderlich: Setze alle Umgebungsvariablen (DB, Auth, OAuth, Cloudinary) im Ziel-Environment.
- Build vorab mit `npm run build`; Start via `npm start` auf dem Zielsystem.

## Kontext
- Einzelprojekt im Studiengang Wirtschaftsinformatik (BFH).
- Zweck: Archivierung, Analyse und Diskussion zur CS–UBS-Fusion sowie den Fällen Archegos/Greensill.
- Zielgruppen: Dozent, Studierende, interessierte Leser; Rollen/Access für Beitragende.

## Lizenz & Disclaimer
- Lizenz: Siehe [LICENSE](LICENSE).
- Disclaimer: Plattform dient Dokumentation/Reflexion, keine Rechts- oder Finanzberatung; Inhalte können subjektiv oder unvollständig sein. Secrets gehören nicht ins Repository; Umgebungsvariablen stets sicher verwalten.

