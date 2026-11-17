# CMS V1.0 — About

## 规则

- **可改**：中央文案、统计数字、拼贴图 `src` / `alt` / `focus`
- **冻结**：`left/top/size/angle/order/scatter` 与动效（仍在 `reference-data.js`）

## CMS

- Single type `about-page`（与旧 `api::about` 并存）
- Components：`shared.about-stat`、`shared.about-collage-image`（`slotIndex` 0–9）
- Public：`GET /api/about-page?locale=zh-CN`

```bash
cd cms-strapi-main
npm run seed:about
npm run seed:about:execute -- --database=.tmp/data.db
```

## 官网

- `?cmsSite=about|all`
- `window.__MARVLORE_ABOUT__` → `resolveAboutCopy()` / `resolveReferenceCards()`

## 预览

```
http://127.0.0.1:5173/?cmsSite=about&cmsBase=http://127.0.0.1:1337#about
```

## 下一步

Hero → Explore → Portal → Inquiry
