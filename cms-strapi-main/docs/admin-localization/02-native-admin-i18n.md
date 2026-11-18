# 02 — Native Admin i18n (P1)

## Finding

Strapi 5.52.1 ships `zh-Hans` for Admin, but **Content Manager’s `zh-Hans.json` is effectively unusable** for CM keys (it embeds admin keys; CM `en` keys are largely missing). Traditional `zh.json` covers ~175/343 CM keys.

## Approach

`src/admin/extensions/i18n/strapi-native-zh-Hans.ts` — curated Simplified overrides derived from:

1. This install’s `content-manager/.../en.json.js`
2. Trad `zh.json` → Simplified via OpenCC
3. Manual fills for draft/published tabs, Entry panel, Preview, History, bulk actions

Merged in `src/admin/app.tsx` via `nativeAdminTranslations()` **before** brand + content-type name overrides.

## Custom ops dictionary (P2 start)

`zh-CN.ts` / `en.ts` + typed `t('dashboard.title')` used by ops module pages.

## Verify

1. Admin locale = 中文 (zh-Hans)
2. Open any Content Manager edit view → tabs show **草稿 / 已发布**, panel **条目**
3. List create button → **创建新条目** (or equivalent CN)
