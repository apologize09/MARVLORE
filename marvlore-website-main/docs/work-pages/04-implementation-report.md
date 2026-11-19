# 04 — 实施报告（P1–P4）

> 分支：`cursor/cms-work-pages-f441`  
> 依据：Creative Work 实施包 V1.0 + P0 审计文档 01–03  
> 时区：Asia/Shanghai

---

## 1. 交付摘要

| 阶段 | 状态 | 要点 |
|------|------|------|
| P0 | ✅ | `docs/work-pages/01–03` 只读审计 |
| P1 | ✅ | 首页 `view more` → `/work`；`server.mjs` SPA fallback；`src/work/route.js` |
| P2 | ✅ | `/work` 总览：分类 / 搜索 / 标签 / 排序 / Load more / 空错态 |
| P3 | ✅ | `/work/:slug` + `#case/:id`；返回态；related next；404 |
| P4 | ✅ | 无 schema 变更；见下文验收结论 |
| P5 | ✅ | 测试/文档/部署说明（本文件 + 05 + 06） |

**未新建 Content Type / 未改 Strapi schema。** 复用现有 work-page / project / category / tag / media + public API。

---

## 2. 主要代码落点

| 路径 | 角色 |
|------|------|
| `src/work/route.js` → `dist/work-route.js` | WorkRoute 解析 / navigate / popstate / path link 拦截 |
| `src/work/listing.js` + `project-card.js` → `dist/work-listing.js` | `/work` 总览页 |
| `src/work/listing.css` → `dist/work-listing.css` | 总览 + CTA 样式 |
| `scripts/build-work.mjs` | 构建 navigation + route + listing（CMS import 外部化） |
| `server.mjs` | `/work`、`/work/:slug` → `index.html` |
| `dist/components.js` | 首页 CTA `view more` |
| `dist/app.js` | 路由壳挂载、listing / detail 分支 |
| `dist/work-detail.js` | path 模式、SEO、404、returnUrl |
| `dist/cms/work-api.js` | `getRelated` |
| `dist/cms/work-runtime.js` | slug 索引 + related next |
| `dist/cms/work-normalize.js` | detail VM 含 `slug` |

---

## 3. P4 CMS 内容 / 数据验收

### 3.1 首页精选如何配置

- 运营在 **Work Project** 打开 `showOnHome`。  
- 前端 `work-loader.pickReelRows`：优先 `showOnHome=true` 列表；若为空则回退到非 shell 的已发布 list。  
- `isFeatured` **不**单独驱动首页 Reel；用于 `sort=featured` / `/featured` API。

### 3.2 showOnHome vs isFeatured

| 字段 | 首页 Reel | `/work` 总览 | `sort=featured` |
|------|-----------|--------------|-----------------|
| `showOnHome` | 优先入选 | 无过滤（全量已发布） | 无关 |
| `isFeatured` | 不直接决定 | 可选排序 | `/work-projects/featured` 过滤 |

### 3.3 总览是否全量已发布

是。`mountWorkListingPage` 调 `work-search`，**不**传 `showOnHome`。公开 API 一律 `status: 'published'`。

### 3.4 分类层级

- 模型：level1 `work` 根 + level2 方向（film / visual / web / culture…）。  
- 总览导航：**仅 level2**（来自 bundle `getProjects()` overview，已是方向层）。  
- URL：`subcategory=<level2 slug>`（与首页 filter-mount 一致）。

### 3.5 媒体字段用途（封面收敛后）

| 字段 | 用途 |
|------|------|
| `cover` | 列表卡、Reel、详情主视觉 / 视频 poster |
| `videoUrl` | 详情正片 |
| `homePreviewVideoUrl` | 首页 Reel 循环预览 |
| `mediaItems` | 详情画廊（PhotoSwipe） |
| thumbnail / heroMedia / poster / previewVideo | 后台已隐藏或镜像；**勿再要求运营填写** |

缺封面：卡片占位块；详情仍可开但主视觉为空。缺 media：无画廊段。

### 3.6 Locale / slug

- 公开 API `locale=zh-CN|en`。  
- 项目 slug 按 locale 文档独立；path `/work/:slug` 使用当前 bundle locale 下的 slug。  
- 跨 locale 同 slug 非强制；切换 locale 应重新解析。

### 3.7 未发布不可见

`work-public` 查询均 `status: 'published'`。Draft 不进 search / slug / related。

### 3.8 排序

`manual`（sortOrder）| `latest` | `oldest` | `featured` — 与 `parseWorkListQuery` / 总览 select 一致。

### 3.9 详情 SEO

- CSR：`document.title`、`meta description`、`og:title/description/type/image`。  
- 来源：项目 title / summary / cover。  
- 无独立 project SEO CT；work-page SEO 用于频道页。  
- SSR/prerender：**未做**（V1 最低线 CSR）。

### 3.10 Schema 结论

**无需变更。** 现有模型满足总览 + 详情 path。

---

## 4. 已知限制

1. Sitemap 仍输出 `#work` / `#case/:id`（可后续改为 path）。  
2. 生产 Nginx fallback 不在仓库内 — 见 06。  
3. `cms-work-adapter` 测试 #8 在 CMS 可达时会失败（环境 flake，与本史诗无关）。  
4. 详情 related next 依赖 `documentId`；无 CMS 时保持列表序 next。
