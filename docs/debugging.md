## Browser-Erweiterungs-Konsolenprotokolle (SES/lockdown)

Wenn Sie Konsolenprotokolle wie die folgenden sehen:

- `SES Removing unpermitted intrinsics … lockdown-install.js`
- Stack Traces mit `moz-extension://.../scripts/lockdown-install.js` oder `lockdown-run.js`

Diese stammen von einer Browser-Erweiterung, die SES/lockdown-Skripte injiziert (z. B. Datenschutz-/Sicherheitserweiterungen). Die Anwendung selbst importiert oder bündelt SES/lockdown **nicht**. Um dies zu überprüfen:

1. Deaktivieren Sie Erweiterungen oder öffnen Sie ein Inkognito-/privates Fenster ohne Erweiterungen.
2. Laden Sie die App neu; die Meldungen sollten verschwinden, wenn die Erweiterung die Quelle war.

Für diese von Erweiterungen generierten Protokolle sind keine Änderungen an der App erforderlich.

## npm audit (Next.js 15.5.9 Patch)

- Befund: npm audit meldete eine High-Severity-Schwachstelle in `next` (GHSA-mwv6-3258-q52c DoS + GHSA-w37m-7fhw-fmv9 Source Code Exposure) für Versionen `< 15.5.8`.
- Fix: Update auf `next@15.5.9` (Patch/Minor, keine Breaking Changes) via `npm install next@15.5.9`.
- Reasoning: Empfohlene Upstream-Fixversion, kleinste Änderung ohne Major-Bump; Build und Lint bleiben unverändert lauffähig.