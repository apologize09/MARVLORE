# CMS V1.0 — Services

## CMS

- Collection `service-item`（flat 9 条，对齐 `src/services/items.js`）
- Public：`find` / `findOne`；仅 published + `isActive`
- 种子：

```bash
cd cms-strapi-main
npm run seed:services
npm run seed:services:execute -- --database=.tmp/data.db
```

未建 `service-category`：现网目录无分类维度。

## 官网

- Flag：`?cmsSite=services` 或 `all`（`cmsWork=all` 亦开）
- `bootWorkBundle` 写入 `window.__MARVLORE_SERVICE_ITEMS__`
- `mountServices` 读取该数组；失败回静态 `items.js`
- **不改** Services DOM / title-motion / CSS

## 预览

```
http://127.0.0.1:5173/?cmsSite=services&cmsBase=http://127.0.0.1:1337#services
```

## 下一步

About → Hero → Explore → Portal → Inquiry
