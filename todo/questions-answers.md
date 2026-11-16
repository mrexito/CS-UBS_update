# Regulatory Compliance – Clarifying Questions & Answers

2026-10-12 · Yannic Reust

## Context

These questions were answered before the implementation plan ([plan.md](plan.md)) was written. The task ([task.md](task.md)) adds a "Regulatory Compliance" area with navigation, an overview page and five subpages. The inputs were three mockups: `image003.png` (navigation), `image006.png` (overview) and `image007.png` (chapter 7, capital ratios). The questions cover points that neither the task nor the mockups settle.

## Questions and answers

Five questions were asked. Each answer fixes one decision in the plan.

| # | Question | Options offered | Answer | Decision in the plan |
| --- | --- | --- | --- | --- |
| 1 | The mockup shows only an excerpt of Tables 5 and 6 (4 rows each). Where does the full data for Q1 2019 to Q2 2023 come from? | I'll provide it · Show the excerpt only · It's in the repo | Show the excerpt only | Tables and charts use the 4 quarters shown: Q1 2019, Q4 2022, Q1 2023, Q2 2023. |
| 2 | Which languages should the new content have (the site supports de/en/fr/es/it)? | All 5 via messages · DE + EN only · DE only | All 5 via messages | All new keys go into all 5 `messages/*.json` files. |
| 3 | What URL slugs should the 5 subpages use? | German slugs · English slugs | Check how the site already handles slugs, e.g. for the blogs | Answered from the codebase (next section): one English slug for all languages. |
| 4 | Should the new pages go into the sitemap and the site search? | Sitemap + search · Sitemap only · Neither | Sitemap + search | Add the new paths to `app/sitemap.ts` and add a new search provider in `lib/search/providers`. |
| 5 | In Table 6 (leverage) only Q1 2019 is fully legible. Q4 2022 is cut off, and Q1/Q2 2023 are missing apart from the 7.56% peak. Can you send the values? | I'll send them · Use the 3 visible values | Use the 3 visible values | Q1 2019 in full, Q4 2022 as read (5.42 / 3.25 / 7.69 / 7.55 / 15.24), Q1 2023 CET1 Lev. 7.56. All other cells are empty and show "–". |

## Slug handling, answered from the codebase

The site uses one slug for every language, so the new pages get one English slug each. The config in `i18n/routing.ts` has no `pathnames` entry, which next-intl would need for per-language slugs. All existing routes use a single English slug: `/blogs`, `/blogs/[id]`, `/archegos`, `/greensill`, `/about`, `/organigram`.

| Topic | Route |
| --- | --- |
| Overview | `/regulatory-compliance` |
| Kapitalquoten (chapter 7) | `/regulatory-compliance/capital-ratios` |
| Liquidität | `/regulatory-compliance/liquidity` |
| Krise & Marktvertrauen | `/regulatory-compliance/crisis-market-confidence` |
| Regulatorische Massnahmen | `/regulatory-compliance/regulatory-measures` |
| AT1-Instrumente | `/regulatory-compliance/at1-instruments` |

## Still open

- [ ] What is the exact source citation for chapter 7? It isn't visible in the mockup (bachelor thesis, CS annual reports, FINMA?).
- [ ] Do the Q4 2022 values read from the cut-off Table 6 row match the source?
- [ ] Who writes the fr/es/it translations: the team, or are they maintained in i18nexus?
