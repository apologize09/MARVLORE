# CMS Phase 6 — Work 搜索筛选与 URL

在 Phase 5 Adapter 之上，为 Work 增加 **query 筛选状态**（不改现有 hash 详情路由）。

## 行为

| 能力 | 说明 |
|---|---|
| 关键词 | `q` → `GET /api/work-search`（debounce 300ms） |
| 分类 | 现有分类按钮写入 `subcategory`（L2：film/visual/web/culture） |
| 标签 | 多选，**OR**（`tags=cgi,3d`） |
| 排序 | `sort=manual\|latest\|oldest\|featured` |
| 分页 | `page` / `pageSize`（max 48，服务端已限） |
| URL | 筛选进 **search**；`#work` / `#case/{id}` **保持** |
| 前进后退 | `popstate` 恢复筛选并重新请求 |
| 空结果 | 显示「没有符合条件的作品」+ **清空筛选** |

## 启用

需 Phase 5 flag 打开 list 及以上，或显式：

```
?cmsWork=all&cmsBase=http://127.0.0.1:1337&cmsFilter=1#work
?cmsWork=list&q=Film&subcategory=film&tags=cgi#work
```

`cmsWork=off` 时不挂载筛选条，行为与线上一致。

## 代码

- `dist/cms/work-filter-state.js` — 解析/序列化/对账
- `dist/cms/work-filter-mount.js` — UI + debounce + search
- `dist/cms/work-api.js` — `search()`
- `dist/work-reel.js` — 监听 `marvlore:work-filter` 更新 pool
- `dist/work-filter.css`

## URL 兼容（Phase 0）

- 继续使用 `#work`、`#case/{id}`、`#view/{id}`
- **不**引入 `/work/:slug` 路径（仍 deferred）
- 筛选只占用 query，避免破坏已有 hash 分享链接

## 验证

```bash
cd marvlore-website-main
pnpm test
pnpm check
# 预览
# http://127.0.0.1:5173/?cmsWork=all&cmsBase=http://127.0.0.1:1337#work
# 搜索 Film → reel 收窄；清空 → 恢复 overview
```
