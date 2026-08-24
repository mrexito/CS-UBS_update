Status zuvor:
Ein automatisierter Regressionstest vor/nach dem Upgrade war nicht möglich, da im Projekt kein Test-Framework (Jest/Vitest/Playwright) eingerichtet ist. Die Verifikation erfolgte stattdessen manuell über: npm run build, npm run lint -> keine Fehler in der Brwoser konsole -> lint auch ohne probleme
da kein prisma mongodb adapter existiert kann das update nicht durchgeführt werden
