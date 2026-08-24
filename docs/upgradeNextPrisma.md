Status zuvor:
Ein automatisierter Regressionstest vor/nach dem Upgrade war nicht möglich, da im Projekt kein Test-Framework (Jest/Vitest/Playwright) eingerichtet ist. Die Verifikation erfolgte stattdessen manuell über: npm run build, npm run lint -> keine Fehler in der Brwoser konsole -> lint auch ohne probleme
da kein prisma mongodb adapter existiert kann das update nicht durchgeführt werden

upgrade to next js successfull dev run works, build does not work, need o migrate midleware to proxy -> auto run px @next/codemod@canary middleware-to-proxy to fix -> needed to chang files so page was passed as seconbd paramaeter -> needed to change the env file to fix now build is smooth
