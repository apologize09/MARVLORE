# 05 — 测试与验收清单

> 对应实施包 §8–§10 / P5。  
> 自动化：仓库内可跑部分。标「人工」项需浏览器确认。

---

## 1. 自动化（本分支已跑）

| 命令 | 结果 |
|------|------|
| `pnpm check` | ✅ 含 `work-route` / `work-listing` |
| `node --test tests/work-*.test.mjs` | ✅ route / spa-fallback / listing / detail-nav |
| `pnpm test` | ⚠️ 全量 140；`cms-work-adapter` #8 在 CMS 存活时期望 fallback 失败（既有环境 flake） |
| `pnpm build` | 见本轮最终构建 |

新增测试文件：

- `tests/work-route.test.mjs`
- `tests/work-spa-fallback.test.mjs`
- `tests/work-listing.test.mjs`
- `tests/work-detail-navigation.test.mjs`

---

## 2. 功能验收

### 首页

- [x] Creative Work 区保留 Reel / 分类 / 箭头（未改 reel 行为）
- [x] 新增 `view more` CTA → `/work`（`data-work-channel-cta`）
- [x] 「浏览项目组 / 查看项目」仍服务首页内态与 `#case`
- [ ] **人工**：hover / focus-visible / reduced-motion 观感

### 作品总览 `/work`

- [x] 直达与刷新返回 `index.html`（`work-spa-fallback` 测试）
- [x] Hero 标题/简介来自 work-page
- [x] level2 分类写入 `subcategory` query
- [x] 搜索防抖、标签、排序、pageSize=12、Load more
- [x] 空结果 / 搜索失败 fallback
- [x] 卡片链到 `/work/:slug`
- [x] Contact 链到 `/#contact`
- [ ] **人工**：移动端单列、键盘扫分类/筛选

### 详情

- [x] `/work/:slug` 打开现有 work-detail UI
- [x] `#case/:id` 兼容保留
- [x] 返回优先 `history.back` / `returnUrl`（含筛选）
- [x] PhotoSwipe / 视频延迟加载逻辑保留
- [x] related API 优先 next；否则列表序
- [x] 无效 slug → 品牌 404 文案
- [x] title / description / OG 更新
- [ ] **人工**：复制链接、前进后退、视频离开释放

### 工程

- [x] `src/work` + `build-work` + `hash-assets`
- [x] `check` 含新产物
- [x] 首页 Reel 模块未重写

---

## 3. SEO / a11y（最低线）

| 项 | 状态 |
|----|------|
| `/work` document.title | ✅ listing SEO helper |
| `/work/:slug` title + meta + OG | ✅ detail `applyDetailSeo` |
| canonical / prerender | ❌ 非 V1 |
| CTA / 筛选 focus-visible | ✅ CSS |
| prefers-reduced-motion | ✅ CTA / 卡片 / 详情动画沿用 |

---

## 4. 待人工冒烟（建议）

1. 本地 `pnpm build && pnpm start`，打开 `/` → view more → `/work`。  
2. 筛选 `?subcategory=film&q=…` 刷新后状态仍在。  
3. 打开卡片 → 复制 URL → 新标签打开。  
4. 详情返回后筛选与滚动大体恢复。  
5. 首页 `#work` Reel 与 `#case/:id` 回归。  
6. 若有 Nginx，确认 `try_files $uri /index.html`。
