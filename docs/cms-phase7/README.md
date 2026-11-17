# CMS Phase 7 — 双语、SEO、缓存

## i18n

- Strapi **5.52.1** 自带 `@strapi/i18n@5.52.1`（`config/plugins.ts` 显式 `i18n.enabled`）
- Bootstrap 确保 locales：`zh-CN`（默认）+ `en`
- 校验：`cd cms-strapi-main && npm run verify:i18n`

### 英文 localization（不编造文案）

```bash
# dry-run
npm run i18n:work

# 写入 en：拉丁文案保留；纯中文字段留空；SEO metaTitle 用英文 title
npm run i18n:work:execute -- --database=.tmp/data.db
```

同一 `documentId` 多 locale；后台可继续补全翻译。

## SEO

- `shared.seo`：`metaTitle` / `metaDescription` / `shareImage`
- 官网 CMS 开启时，用 `work-page.seo` 写 title / description / OG + `hreflang`
- 语言切换：`?cmsLocale=en` 或右下角开关（仅 CMS 模式）

## Sitemap

官网：

```
GET /sitemap-work.xml
```

只输出**有已发布内容**的 locale；条目使用现有 hash（`#work` / `#case/{id}`）+ `cmsLocale`。

## 缓存

| 层 | 策略 |
|---|---|
| CMS 公开 Work API | `Cache-Control: public, max-age=60, stale-while-revalidate=300` |
| 版本戳 | `GET /api/work-cache-version` + 响应头 `X-Marvlore-Work-Cache` |
| 发布/下架/改稿 | Document middleware bump 版本 |
| 浏览器 Adapter | `work-cache.js`；focus/30s 轮询版本，变化则 `cacheClear()` |
| 官网媒体 | 既有 `server.mjs` 媒体 max-age |

## 预览

```
http://127.0.0.1:5173/?cmsWork=all&cmsBase=http://127.0.0.1:1337#work
http://127.0.0.1:5173/?cmsWork=all&cmsLocale=en&cmsBase=http://127.0.0.1:1337#work
http://127.0.0.1:5173/sitemap-work.xml
```
