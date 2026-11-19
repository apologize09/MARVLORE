# 01 — Creative Work 当前架构审计（P0）

> 仓库：`apologize09/MARVLORE`  
> 审计分支：`cursor/cms-work-pages-f441`（基于 `main` @ `37e8cbb`）  
> 日期：2026-11-19（Asia/Shanghai）  
> 模式：**只读审计** — 本阶段不改应用代码  

依据：`MARVLORE Creative Work 作品页面规划与 Cursor 实施包 V1.0`

---

## 1. 结论摘要

| 问题 | 结论 |
|------|------|
| 是否已有独立 `/work` 页？ | **否**。作品频道全部挂在首页 SPA 的 `#work` / `#case/:id` |
| 首页「view more」真实位置？ | **字面文案不存在**。最接近的入口是概览卡 `.view-work`「浏览项目组」与 Reel `.work-reel-detail`「查看项目」 |
| CMS / API 是否够用？ | **够用**。`work-search` 已支持 q/category/subcategory/tags/year/projectType/sort/page/pageSize |
| source / dist？ | **混合**：仅 `work-navigation`（及 hero/services/about/menu/contact）经 esbuild；其余 Work 模块以 `dist/*.js` 为实际源 |
| `/work` 刷新？ | **会 404**。`server.mjs` 无 SPA fallback，未知 path → `Not found` |

---

## 2. 首页 Creative Work 模块

### 2.1 DOM / 源码位置

- 标记函数：`export function Work()` — `marvlore-website-main/dist/components.js`
- 挂载：`dist/app.js` → `start()` 把 `Work` 等拼进 `#app`，再 `mountWorkReel()` / `mountWorkFilters()` / `mountWorkDetails()`
- 根节点：`<section id="work" … data-work-mode="overview">`

### 2.2 结构（概览 → Reel）

1. **Header**：`work-page.title` / `intro`（CMS），缺省「Creative Work」与中文介绍  
2. **分类 toolbar**：`data-work-category`（全部 + level2 方向）  
3. **`#work-overview` 网格**：每张 `a.work-card` + `.view-work`「浏览项目组」→ `href="#work"`，由 `work-reel` / interactions 切到分类 Reel  
4. **`.elastic-reel`**：切片画廊；展开后 `.work-reel-detail`「查看项目」→ `#case/:legacyId`  

### 2.3 「view more」待核实 / 映射

实施包假设存在 `view more` CTA。当前仓库：

| 控件 | 文案 | 现状行为 |
|------|------|----------|
| `.view-work` | 浏览项目组 | 进入首页内分类 Reel，**不是**独立频道 |
| `.work-reel-detail` | 查看项目 | 打开详情 `#case/:id` |
| 字面 `view more` | — | **未找到** |

**P1 建议（与文档一致）：** 在 `#work` header 或 overview 区新增频道级 CTA（文案可用 `view more`），`href="/work"`，**不**再只调 `showOverview()`。保留现有「浏览项目组 / 查看项目」行为，避免破坏 Reel。

---

## 3. 模块调用关系

```text
app.js start()
  ├─ bootWorkBundle()          cms/work-runtime.js
  │    └─ resolveWorkBundle()  cms/work-loader.js
  │         ├─ work-api (page/categories/list/home/…)
  │         ├─ work-normalize → overview / reel / detail VM
  │         └─ work-fallback 静态兜底
  ├─ Work() HTML               components.js
  ├─ mountWorkReel()           work-reel.js  (showOverview / showCategory)
  ├─ mountWorkFilters()        cms/work-filter-mount.js  (URL search + 首页栏)
  ├─ mountWorkDetails()        work-detail.js  (#case/:id)
  └─ mountWorkInteractions / Entrance / Navigation
```

- `showOverview()` / `showCategory()`：**首页 `#work` 内部视图状态**，≠ `/work` 频道页（与实施包 §1.1 一致）。  
- 筛选：`work-filter-state.js` 读写 **search params**，保留 hash；事件 `marvlore:work-filter` 驱动 Reel。  
- 详情：`ensureWorkDetail()` 懒加载；`open({id})` 用 **legacyId**（非 slug）。

---

## 4. Source ↔ Dist 对应

| 产物 | 源 / 构建 | 备注 |
|------|-----------|------|
| `dist/work-navigation.js` | `src/work-navigation.js` ← `scripts/build-work.mjs` (esbuild) | 唯一明确 Work 构建入口 |
| `src/work/text-reveal.js` | 经 about `reference` 构建间接使用 | 非 listing |
| `dist/work-reel.js` 等 | **无对应 src，dist 即源** | 手工维护 |
| `dist/cms/work-*.js` | **dist 即源** | 含 api/loader/normalize/filter |
| `dist/components.js` / `app.js` | **dist 即源** | HTML 模板与启动 |
| hero/services/about/menu/contact | `src/**` + `scripts/build-*.mjs` | 与 Work listing 无关 |

**构建顺序（`package.json`）：**  
`build-hero → services → about → work → menu → contact → apply-media-cdn → hash-assets`  
`check`：语法检查若干 dist；`test`：`tests/*.test.mjs`（含 `cms-work-adapter` / `cms-work-filter`）。

**待核实：** 生产 Nginx 配置不在本仓库；本地仅 `server.mjs`。

---

## 5. 路由与 server.mjs

- 当前：单页 `dist/index.html`；作品靠 `location.hash`（`#work` / `#case/:id` / `#project-`）。  
- `server.mjs`：按 path 读静态文件；失败 **404 Not found**；**无** `/work` → index.html fallback。  
- Sitemap：`/sitemap-work.xml` 仍发 `…#work` / `…#case/:id`。  

**P1 必改：** 对 `/work`、`/work/:slug`（及可选尾斜杠）返回 `index.html`，否则刷新必挂。

---

## 6. CMS / API（已确认）

### 公开路由（节选）

- `GET /api/work-projects`、`/featured`、`/slug/:slug`、`/related/:documentId`  
- `GET /api/work-search`  
- `GET /api/work-categories`（tree）、`/work-tags`、`/work-page`、`/work-cache-version`  

实现：`cms-strapi-main/src/services/work-public.ts` + `src/utils/work-query.ts` + DTO。

### `work-search` / list query（`parseWorkListQuery`）

| 参数 | 说明 |
|------|------|
| `locale` | `zh-CN` \| `en` |
| `q` | 标题/客户/摘要等 `$or` |
| `category` / `subcategory` | slug |
| `tags` | 逗号分隔 slug |
| `year` / `projectType` | image\|video\|mixed |
| `showOnHome` | bool（首页 Reel） |
| `sort` | manual\|latest\|oldest\|featured |
| `page` / `pageSize` | 默认 12，最大 48 |

响应含 `paginationMeta` + search 时回显 `query`。

### 模型要点

- 分类：**level1 = Work 父**，**level2 = 影视/视觉/网站/文化**（项目必须挂 level2）。  
- 作品媒体运营侧已收敛：**封面** + **视频** + **首页预览视频**（schema 仍留停用列）。  
- `work-project-media`：`blockType` image/video + image/video/poster URLs + caption/sortOrder…  
- `work-page`：title/intro/featuredProjects/displayCategories/showFeatured/seo  

### 首页数据优先级（loader）

`resolveWorkBundle`：`showOnHome=true` 列表优先作 Reel；否则非 direction-shell 的全量 list。Overview 优先 `work-page.displayCategories`，否则 category tree 的 level2。

---

## 7. SEO / 缓存

- `dist/cms/seo.js` → `applyWorkSeo`：客户端改 title/description/OG（CSR）。  
- `work-cache-sync`：轮询 cache-version，失效则 reload。  
- 独立 `/work/:slug` 的可抓取 HTML：**待核实 / V1 可先 CSR**，与实施包 §9 一致。

---

## 8. 测试覆盖

已有：`tests/cms-work-adapter.test.mjs`、`cms-work-filter.test.mjs`、`cms-i18n-seo.test.mjs` 等。  
**缺失：** route / listing / detail path 导航测试（实施包 §11 建议项）。

---

## 9. 与实施包差距清单

1. 无 `/work` listing UI 与 route adapter  
2. 详情无 `/work/:slug`（仅 `#case/:legacyId`）  
3. 无频道级 view more → `/work`  
4. `server.mjs` 无 path fallback  
5. filter-mount 绑在 `#work` DOM，需适配独立页  
6. source/dist 策略需在改动前固定（建议：新模块走 `src/work/*` + 扩展 `build-work.mjs`；触碰旧 dist 模块时同步文档说明）
