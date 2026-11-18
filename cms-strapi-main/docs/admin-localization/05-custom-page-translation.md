# 05 — Custom ops page translation (P2)

## Dictionary

| File | Role |
|------|------|
| `src/admin/extensions/i18n/zh-CN.ts` | Chinese ops copy |
| `src/admin/extensions/i18n/en.ts` | English fallback |
| `src/admin/extensions/i18n/types.ts` | `OpsDict` / `OpsKey` |
| `src/admin/extensions/i18n/index.ts` | `t()` + `nativeAdminTranslations()` |

Locale follows `localStorage['strapi-admin-language']` (default `zh-Hans` → zh-CN dict).

## Page coverage

| Page | Route | Via `t()` | Card labels |
|------|-------|-----------|-------------|
| 工作台 | `/ops/dashboard` | title, lead, stats, shortcuts, mediaFiles, nav shortcuts | `DASHBOARD_STATS` labels in `routes.ts` (CN) |
| 官网内容管理 | `/ops/website` | title, lead | `WEBSITE_LINKS` in `routes.ts` (CN) |
| 作品案例管理 | `/ops/work` | title, lead | `WORK_LINKS` (CN) |
| 媒体资源管理 | `/ops/media` | title, lead | `MEDIA_LINKS` (CN) |
| 内容与 SEO | `/ops/seo` | title, lead | `SEO_LINKS` (CN) |
| 系统设置 | `/ops/system` | title, lead | `SYSTEM_LINKS` (CN) |

Sidebar intl ids: `marvlore.ops.*` in `app.tsx` + `register.ts` defaultMessage (CN).

## Intentional residuals

1. **Hub card labels** stay in `routes.ts` as Chinese string constants (ops-first). Not scattered EN. Moving them into `OpsDict` is optional follow-up; `verify-admin-localization` already guards `t()` keys.
2. **Dynamic counts / API data** are not translated.
3. **Module badges** (`hero`, `work`, …) remain technical tags on cards.

## Omissions / future

- Per-card keys in `OpsDict` for Profile=`en` operators
- Empty/error toasts on dashboard fetch failures (currently silent `—`)
