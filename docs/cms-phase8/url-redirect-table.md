# Phase 8 — URL 兼容与重定向表

产品锁定（Phase 0）：**继续 hash Work URL**；V1.1 建议的 `/work/...` **延期**，未经确认不启用。

## 现网保留（无强制 3xx）

| 现网形态 | 含义 | Phase 8 策略 |
|---|---|---|
| `#work` | Work 总览 | 保持 |
| `#case/{id}` | 详情（legacyId / 兼容 id） | 保持；CMS 模式映射 `legacyId` |
| `#project-{id}` / `#view/{id}` | 其它产品路由 | 保持，非本波次 |
| `#home` / `#services` / `#marvlore-go` | 站内锚点 | 保持 |

完整审计见 [`../cms-phase0/url-inventory.csv`](../cms-phase0/url-inventory.csv)。

## CMS 模式 query（非路由迁移）

| Query | 作用 | 备注 |
|---|---|---|
| `cmsWork=off\|categories\|list\|detail\|all` | Adapter 阶段开关 | 默认 off → 静态 |
| `cmsBase=https://…` | 公开 CMS origin | 仅公开 API；无管理 Token |
| `cmsLocale=zh-CN\|en` | 语言 | 默认 zh-CN 可省略 |
| `cmsFilter=1` | 强制开筛选 UI | list/detail/all 时也可隐式开 |
| `q` / `category` / `subcategory` / `tags` / `year` / `type` / `sort` / `page` | Phase 6 筛选 | 与 hash 并存；popstate 恢复 |

示例：

```
/?cmsWork=all&cmsBase=http://127.0.0.1:1337&cmsLocale=en#work
/?cmsWork=all&q=film&tags=cgi,3d#work
/?cmsWork=all#case/film
```

## Sitemap

| 路径 | 规则 |
|---|---|
| `/sitemap-work.xml` | 仅**有已发布内容**的 locale；`loc` 使用 `?cmsWork=all&cmsLocale=…#work` / `#case/{id}` |

## 延期（需产品确认后另开波次）

| V1.1 建议路径 | 状态 | 重定向草案 |
|---|---|---|
| `/work` | 未实现 | 确认后 → `/#work` 或 302 |
| `/work/:categorySlug` | 未实现 | 确认后 → query `category=` + `#work` |
| `/work/.../:projectSlug` | 未实现 | 确认后 → `#case/{legacyId\|slug}` |

**本阶段不添加** `/work` SPA fallback，也不删除 hash 路由。
