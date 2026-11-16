# CMS Phase 3 — Work Public API

Normalized read APIs for Work (no admin tokens in browser; no frontend layout changes).

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/work-page?locale=` | Work page DTO |
| GET | `/api/work-categories?locale=` | Category **tree** DTO |
| GET | `/api/work-categories/tree` | Explicit tree (same payload) |
| GET | `/api/work-categories/:id` | documentId **or** slug |
| GET | `/api/work-categories/slug/:slug` | Slug detail |
| GET | `/api/work-tags?locale=` | Active tags DTO |
| GET | `/api/work-projects?locale=&…` | List DTO + filters |
| GET | `/api/work-projects/:id` | documentId **or** slug detail DTO |
| GET | `/api/work-projects/slug/:slug` | Slug detail |
| GET | `/api/work-projects/featured` | Featured list |
| GET | `/api/work-projects/related/:documentId` | Related (explicit or fallback) |
| GET | `/api/work-search?q=&category=&subcategory=&tags=&…` | Search + filter meta |

### Query rules

- `locale`: `zh-CN` (default) / `en` (`zh` → `zh-CN`)
- `page` ≥ 1; `pageSize` default 12, **max 48** (else `400 INVALID_FILTER`)
- `tags`: comma-separated, **OR** semantics
- `sort`: `manual` \| `latest` \| `oldest` \| `featured`
- Only `status=published`; categories/tags respect `isActive`
- Populate is server-side whitelist (no `populate=*`)

### Errors

```json
{ "error": { "code": "INVALID_FILTER", "message": "…" } }
```

## Code

- `src/utils/work-query.ts` / `work-dto.ts`
- `src/services/work-public.ts`
- Custom routes: `work-*/routes/01-public.ts`

## Verify

```bash
cd cms-strapi-main
pnpm build
node ./scripts/verify-work-query-unit.mjs
node ./scripts/verify-work-api.mjs
```
