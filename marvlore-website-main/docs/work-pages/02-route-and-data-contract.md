# 02 — 路由与数据契约（P0）

> 配套：`01-current-architecture-audit.md`  
> 模式：只读结论 → 实施契约（尚未改代码）

---

## 1. 推荐路由（与实施包 §3 对齐）

| Path | 类型 | 行为 |
|------|------|------|
| `/` | home | 现有整站；`#work` Reel 保留 |
| `/work` | work-list | 独立总览；筛选在 **search** |
| `/work/:slug` | work-detail | 规范详情；复用 `work-detail` UI |
| `/work?category=film&…` | work-list + filters | `work-filter-state` 契约 |
| `#case/:id` | legacy detail | **继续兼容**，映射同一详情模块 |
| `#work` | home anchor | 滚动到首页区块，不替代 `/work` |

### WorkRoute 状态（建议）

```ts
type WorkRoute =
  | { type: 'home' }
  | { type: 'work-list'; filters: WorkFilters }
  | { type: 'work-detail'; slug: string; filters?: WorkFilters }
  | { type: 'not-found' };
```

`WorkFilters`：**已存在**于 `dist/cms/work-filter-state.js`：  
`q, category, subcategory, tags[], year, projectType, sort, page, pageSize`  
（sort ∈ manual|latest|oldest|featured；pageSize 1–48，默认 12）

**单一 URL owner：** 新建 `route` 模块统一 `pushState` / `replaceState` / `popstate`；禁止 listing、detail、filter 各自改 URL。

---

## 2. 服务端 Fallback 契约

`server.mjs` 必须在静态文件未命中时：

- `GET /work`、`/work/` → `index.html`  
- `GET /work/:slug`（单段、非文件扩展名）→ `index.html`  
- 其余未知 path 可继续 404  

（生产 Nginx 需同等 `try_files`；仓库内无 nginx 配置 → **待部署侧核实**）

---

## 3. 数据契约

### 3.1 列表（总览卡片）

| 来源 | 用途 |
|------|------|
| `GET /api/work-search` 或 `/api/work-projects` | 分页卡片 |
| `GET /api/work-categories` tree | 导航（**只用 level2**） |
| `GET /api/work-tags` | 标签筛选 |
| `GET /api/work-page` | Hero 标题/简介/SEO/displayCategories |

卡片字段（DTO card → normalize）：  
`legacyId|slug`, `title`, `subtitle/summary`, `category.slug`, `coverUrl|cover`, `projectYear`, `projectType`, `focusX`  

列表 **不** 拉 `mediaItems`；详情走 `ensureWorkDetail` / `getProjectBySlug`。

### 3.2 详情

| 页面 | 字段 |
|------|------|
| 标题 / URL | `title` / `slug` |
| 副标题 / 眉题 / 摘要 / 介绍 | `subtitle` / `eyebrow` / `summary` / `description` |
| 分类 / 标签 | `category` / `tags` |
| 主视觉 | **封面** `cover`（视频项目 poster 亦走封面）；正片 `videoUrl` |
| 媒体块 | `mediaItems[]`（image/video + poster + caption…） |
| 客户 / 年份 / 类型 | `clientName` / `projectYear` / `projectType` |

**停用勿再要求运营：** thumbnail / heroMedia / poster / previewVideo（前台已镜像或隐藏）。

### 3.3 首页 vs 总览

| 场景 | 规则 |
|------|------|
| 首页 Reel | `showOnHome=true` 优先，否则非 shell list（现 loader） |
| `/work` 总览 | **全部已发布**（search/list，不受 showOnHome 限制） |
| 精选排序 | `sort=featured` / `isFeatured` |

### 3.4 分类导航

- UI 主筛选 = **level 2** slug（`film` / `visual` / `web` / `culture`…）  
- 写入 filter 的 `category` 或 `subcategory` 与现 `work-public` 过滤器对齐（审计实现：父子 slug 均支持）  
- **禁止**把 level1 `work` 当作可选项目分类

### 3.5 详情 ID 策略

| 入口 | 解析 |
|------|------|
| `/work/:slug` | `getProjectBySlug(slug)` → document；VM `id` 仍可用 legacyId 兼容组件 |
| `#case/:id` | 现逻辑：按 reel/detail 列表的 `legacyId`（或 slug）查找 |

Prev/Next：当前筛选结果顺序；无筛选时同分类或全站 manual 序（P3 定一种并写测试）。

---

## 4. 返回行为契约

进入详情前记录：`returnUrl`（含 search）、`filters`、可选 `scrollY`。  
返回：`history.back` 或 navigate `returnUrl`；无来源 → `/work`。  
避免重复 `pushState` 造成后退环（detail 已用 replace 处理二次打开，path 路由需同等）。

---

## 5. API 缺口

| 能力 | 状态 |
|------|------|
| 搜索/分页/排序/标签/年/类型 | ✅ 已有 |
| 按 slug 详情 | ✅ 已有 |
| related | ✅ 已有 |
| 列表「仅卡片字段」瘦身 | ⚠️ DTO 已是 card；可接受，非阻塞 |
| path SEO SSR/prerender | ❌ 非 V1 必做；CSR meta 最低线 |

**结论：P1–P3 无需新 Content Type / 无需新 API；仅服务端 fallback + 前端路由/页面。**
