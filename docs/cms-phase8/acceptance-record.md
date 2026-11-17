# Phase 8 — 功能验收记录

对照 V1.1 `docs/09-acceptance-test.md`。  
环境：本地 Strapi `127.0.0.1:1337` + 官网 `server.mjs` `127.0.0.1:5173`；SQLite `.tmp/data.db`；时间 **2026-11-17 09:37 Asia/Shanghai**。

图例：`[x]` 本机自动化/脚本已验证 · `[~]` 部分验证 / 依赖人工后台操作 · `[ ]` 未在本阶段执行（见 open-risks）

## A. 兼容与安全

- [x] 原有 Strapi CT 仍在 `src/api`（article/category/author/global/about/faq/certification/page-seo）；Work 为增量 `work-*`
- [~] 官网首页 / About / Contact / Explore：`pnpm build` + 现有 113 单测通过；**未**做全页人工视觉走查录屏
- [x] 管理密钥未出现在 `marvlore-website-main/dist`（检索 `ADMIN_JWT` / `API_TOKEN_SALT` / `TRANSFER_TOKEN` / `ENCRYPTION_KEY` 无命中）
- [x] Public 无 Work 写权限：`POST/PUT/DELETE /api/work-projects` → **403**
- [x] 公开列表仅已发布：`GET /api/work-projects` zh-CN/en `total=19`；Draft & Publish 生效
- [~] 危险上传类型：`config/plugins.ts` 配置 `allowedTypes` / `deniedExecutableTypes`；**未**在本机实际 POST 恶意文件

## B. Work 分类与标签

- [x] 一级/二级：DB 已发布分类 documentId × locale = 5（1 L1 + 4 L2）
- [~] 禁止三级 / 二级必挂一级：Phase 2 document middleware 已落地；本阶段未再造负例
- [x] 标签可挂分类（模型支持）；公开 tags zh-CN published unique = 12
- [x] 停用分类不进公开列表：公开 categories 过滤 `isActive`（控制器约定）
- [~] 有关联作品不可硬删：规则在 Phase 2；未做破坏性删除演练

## C. Work 项目

- [~] 新增/编辑/预览/发布/下架：依赖 Admin UI；本阶段用已迁移数据 + Public API 验证读路径
- [x] 归属活跃二级分类：公开列表带 category `isActive` 过滤；EN 本地化保留 category/tag relations 后 `en total=19`
- [x] 多标签：模型 + 筛选 OR（Phase 6）
- [~] 封面/缩略图/详情媒体独立管理、媒体块排序：字段与 migrate 已覆盖；Admin 操作未逐条点检
- [x] 视频路径仍为静态 `dist/assets/hero-video/*` 引用（Phase 0 决策 A）
- [~] 相关作品不含未发布：related 路由存在；未造专用 fixture

## D. 双语

- [x] `verify:i18n` → locales `en` + `zh-CN`，默认 `zh-CN`
- [x] EN 本地化脚本：拉丁保留 / 纯 CJK 留空；不编造文案
- [x] `?cmsLocale=en` + locale 开关（CMS 模式）；SEO/hreflang（Phase 7）
- [x] 两种语言 SEO：work-page seo + sitemap 分 locale
- [~] 缺译回退策略：EN 空字段依赖前端/静态 fallback；需产品确认是否展示 zh 回退文案

## E. 搜索筛选分页

- [x] `GET /api/work-search?q=film` → total 6（zh-CN）
- [x] Phase 6：query 同步、多标签 OR、清空、popstate（单测覆盖）
- [x] pageSize 受 API 约束（Phase 3）
- [~] 年份/类型全组合矩阵未穷举

## F. 前端回归

- [x] Adapter feature flag 默认 off → 静态数据；`cmsWork=*` 才走 CMS
- [x] API 断开 fallback：`work-fallback.js` + 单测
- [x] hash `#work` / `#case/{id}` 未改为 `/work/*`
- [~] Reel / 详情动效 / 多断点像素级对比：布局冻结约定保留；本阶段无新视觉 diff 附件

## G. 性能

- [x] 公开 API `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- [x] `X-Marvlore-Work-Cache` + `/api/work-cache-version`；GET+HEAD 均带缓存头
- [~] 列表不预加载全部详情媒体：沿用现有 lazy/video 策略；无本机 p95 压测数字

## H. 迁移

- [x] Dry-run 默认；execute 需显式 flag
- [x] 条目对账见 `migration-reconciliation.md`
- [x] 备份恢复演练见 `backup-restore-drill.md`
- [ ] **生产** execute / 删静态源：**未做，需确认**

## 命令结果摘要

| 命令 | 结果 |
|---|---|
| `pnpm check` | exit 0 |
| `pnpm test` | 113 pass / 0 fail |
| `pnpm build` | exit 0 |
| `npm run verify:i18n` | ok |
| `npm run build`（CMS） | exit 0 |
