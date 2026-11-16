# Schema validation results

Date: 2026-11-16 (Asia/Shanghai)

## Environment

- Strapi `5.52.1`, SQLite (`better-sqlite3`)
- `@strapi/i18n@5.52.1` preinstalled with core (no package install/upgrade)
- Backup: `cms-strapi-main/.backups/phase1-20261116/` (local, gitignored)

## Checks

| Check | Result |
|---|---|
| `pnpm run build` | pass |
| Start on **blank** DB (`PORT=1339`, `.tmp/blank-work-models.db`) | pass — admin 200; locales `en` + `zh-CN`; default `zh-CN` |
| Start on **backup copy** (`PORT=1338`, `.tmp/validate-work-models.db`) | pass — admin/articles 200; work routes registered (public 403 by design) |
| Start on **tracked** `.tmp/data.db` (`PORT=1337`) | pass — work_* tables created |
| Legacy row counts vs pre-schema backup | **unchanged** (articles 5, categories 5, authors 2, globals 1, abouts 1, faqs 6, product_lines 3, quote_requests 1, certifications 4, process_steps 7, service_models 3) |
| Localized UID fields in schemas | accepted by build/start (runtime locale-scoped uniqueness deferred to Phase 2 tests) |
| Self-relation `work-category` parent/children | tables `work_categories_parent_lnk` present |
| Frontend layout/animation | untouched; preview `http://127.0.0.1:5174/` still 200 |

## Notes

- Public work-* find permissions intentionally **not** granted (Phase 2).
- No legacy content types deleted or renamed.
- Static video URL string fields included per Phase 0 decision A.
