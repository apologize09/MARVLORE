# 03 — 文件变更计划（P0 → 实施）

> 在 `01` / `02` 契约之上；按实施包 P1–P5 排序。  
> **原则：** 新模块优先 `src/work/*` + 扩展构建；触碰现有 `dist` Work 源时保持单源，避免双写。

---

## 1. 拟新增

```text
marvlore-website-main/
├── src/work/
│   ├── route.js           # WorkRoute 解析 / navigate / popstate
│   ├── listing.js         # /work 挂载与渲染
│   ├── listing-state.js   # 可选：累积 Load More（或复用 filter-state）
│   ├── project-card.js    # 卡片 markup
│   └── detail-route.js    # /work/:slug ↔ detail 适配（可并入 route.js）
├── scripts/build-work.mjs # 扩展：打包上述模块 → dist/work-*.js
├── dist/
│   ├── work-listing.js    # build 产物
│   └── work-listing.css   # 总览样式（可先手写再纳入 hash）
└── tests/
    ├── work-route.test.mjs
    ├── work-listing.test.mjs
    └── work-detail-navigation.test.mjs
```

文档交付（本阶段已写 01–03）：

```text
docs/work-pages/
├── 01-current-architecture-audit.md  ✅ P0
├── 02-route-and-data-contract.md     ✅ P0
├── 03-file-change-plan.md            ✅ P0
├── 04-implementation-report.md       ← P5
├── 05-test-and-acceptance.md         ← P5
└── 06-deployment-and-rollback.md     ← P5
```

---

## 2. 预期修改（现有文件）

| 文件 | 变更 |
|------|------|
| `server.mjs` | `/work`、`/work/:slug` → `index.html` SPA fallback |
| `dist/components.js` **或** 构建源 | `#work` 增加频道 CTA `view more` → `/work` |
| `dist/app.js` | 启动时解析 path；挂载 listing / detail-route；首页模式与 `/work` 分支 |
| `dist/cms/work-filter-mount.js` | 支持挂到 listing 根（不硬绑仅 `#work`）；或 listing 自管筛选 UI 复用 state/api |
| `dist/work-detail.js` | 支持以 slug 打开；path URL；保留 `#case/:id` |
| `dist/work-reel.js` | **尽量不改**行为；仅确保 CTA 不误绑 `showOverview` |
| `dist/cms/seo.js` | listing/detail 分支 title/description/canonical |
| `package.json` | `build-work` 产物加入 `check` |
| `dist/index.html` | 如需预链 listing CSS |
| Sitemap（`server.mjs`） | 逐步改为 `/work`、`/work/:slug`（可 P5） |

**不改：** Strapi schema / 新 CT / DTO 字段含义；首页 Reel 视觉；删除 `#case`。

---

## 3. 分期落地

### P1 — CTA + 路由壳

1. `server.mjs` fallback  
2. `src/work/route.js`：解析 `/` | `/work` | `/work/:slug`  
3. `/work` 最小壳（标题占位，可先空网格）  
4. Header CTA `view more` → `/work`（a11y + reduced motion）  
5. 构建接入 + 手工验证刷新 `/work` ≠ 404  

### P2 — 总览页

1. Hero ← `work-page`  
2. level2 分类 + 复用 filter-state（search URL）  
3. 搜索/标签/排序 + `work-search` pageSize=12  
4. `project-card` 网格 + Load More 累积页  
5. 空/错误/fallback  
6. Contact 锚点或现有底部  

### P3 — 详情 path

1. `/work/:slug` → `getProjectBySlug` + 现有 detail UI  
2. `#case/:id` 兼容  
3. 返回恢复 filters/scroll  
4. related / prev-next 规则落地  
5. 404 态；SEO meta  

### P4 — CMS 验收

1. 核对 showOnHome / featured / 总览全量  
2. 封面策略、未发布不可见  
3. 无 schema 变更则只出验收记录  

### P5 — 回归与文档 04–06

`pnpm test` / `pnpm check` / `pnpm build`；补测试；部署与回滚说明。

---

## 4. 风险与缓解

| 风险 | 缓解 |
|------|------|
| dist 双写 | 新代码只进 `src/work`；改旧模块时在 PR 注明「dist 为源」 |
| filter 与 reel 事件冲突 | `/work` 页不挂载 reel；事件命名空间或早退 |
| slug vs legacyId | path 用 slug；hash 用 legacyId；VM 同时保留 |
| hash-assets 漏网 | 每次改 dist 引用后跑完整 `pnpm build` |

---

## 5. P0 验收勾选

- [x] view more 真实情况已说明（字面缺失 → 新增 CTA）  
- [x] source/dist 对应关系已说明  
- [x] 路由方案 + server fallback 需求已说明  
- [x] API 能力与缺口已说明  
- [x] 本阶段未改应用运行时代码（仅新增审计文档）
