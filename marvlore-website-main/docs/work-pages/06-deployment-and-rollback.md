# 06 — 部署与回滚

---

## 1. 部署前

```bash
cd marvlore-website-main
pnpm install
pnpm build    # build-* → apply-media-cdn → hash-assets
pnpm check
pnpm test     # 注意 cms-work-adapter #8 环境 flake
```

确认产物：

- `dist/work-route.js` / `dist/work-listing.js` / `dist/work-listing.css`
- `dist/index.html` 引用 listing CSS 与 hashed `app.js`
- `dist/asset-manifest.json` 已更新

CMS：无需迁移。公开 API 保持现网。

---

## 2. Node（`server.mjs`）

已内置：

- `GET /work`、`/work/`、`/work/:slug` → `dist/index.html`
- 静态资源与 hash `?v=` 缓存策略不变

```bash
pnpm start   # 或 PORT=5173 node server.mjs
```

---

## 3. Nginx（生产必查）

仓库无 Nginx 配置。生产需等效 SPA fallback，例如：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
# 或至少：
# /work 与 /work/* 回源到 index.html（勿把带扩展名的静态文件当 slug）
```

未配置时：**刷新 `/work` 会 404**（正是 P1 要修的问题）。

---

## 4. 回滚

1. **应用回滚**：将网站部署回上一发布的 `marvlore-website-main` artifact / commit（`main` 上本 PR 合并前）。  
2. **无需 CMS 回滚**：无 schema / 数据迁移。  
3. **兼容性**：回滚后 `/work` 会再次 404（若仅静态托管且无 fallback）；`#work` / `#case/:id` 仍可用。  
4. **紧急开关**：可临时去掉首页 CTA（`components.js` 中 `data-work-channel-cta`）并还原 `server.mjs` fallback；不推荐只回半套。

---

## 5. 监控建议

- 4xx：`/work`、`/work/*` 刷新是否突增 404 → 查网关 fallback。  
- CMS：`/api/work-search`、`/api/work-projects/slug/:slug` 延迟与 5xx。  
- 前端：`[work-listing] search failed` / `[cms] ensureWorkDetail failed` 日志。
