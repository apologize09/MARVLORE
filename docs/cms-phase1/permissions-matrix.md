# Permissions matrix (Phase 2 target)

Phase 1 does **not** grant Public work-* read. Existing bootstrap `PUBLIC_ACTIONS` unchanged for work types.

| Content type | Public | Authenticated | Editor | Admin |
|---|---|---|---|---|
| work-category | find, findOne (published + isActive) | — | CRUD + publish | full |
| work-tag | find, findOne | — | CRUD + publish | full |
| work-project | find, findOne | — | CRUD + publish | full |
| work-project-media | find, findOne (via project populate) | — | CRUD + publish | full |
| work-page | find | — | update + publish | full |
| Legacy CTs | unchanged | unchanged | unchanged | unchanged |

Public filters (Phase 2/3): `publicationState=live`, `isActive=true` where applicable; populate whitelist only.
