# CMS Phase 0 — 仓库审计报告（只读）

> 分支：`cursor/cms-phase0-audit-f441`  
> 依据：MARVLORE CMS V1.1 Pack Phase 0 + 合并路径波次 A0  
> 范围：不修改业务代码；仅输出审计文档  
> 时间：2026-11-16（Asia/Shanghai）

## 1. 系统事实（已核对）

| 项 | 事实 |
|---|---|
| 官网 | `marvlore-website-main`：React 19 + esbuild，**不是** Next.js |
| 官网包管理 | `pnpm@11.25.0` |
| 动效依赖 | GSAP 3.13 / `@gsap/react` / Motion 14.6 / Matter.js 0.20 |
| CMS | `cms-strapi-main`：`@strapi/strapi@5.52.1` + `better-sqlite3` |
| CMS i18n | `package.json` **未**声明 `@strapi/plugin-i18n`；`config/plugins.ts` 仅配置 upload MIME 与 users-permissions |
| CMS 现有 API | about, article, author, category, certification, faq, global, page-seo, process-step, product-line, quote-request, service-model（12 个） |
| Public 权限引导 | `src/index.ts` 对旧类型 find/findOne；`quote-request` 仅 `create` |
| 本地 DB | `.tmp/data.db` 约 1.6MB（工作区当前文件；**勿提交**） |
| uploads | `public/uploads` 约 20MB |
| 官网测试基线 | `pnpm test` → **93 pass / 0 fail**（本阶段记录） |

## 2. Work 静态数据盘点

详见 `work-static-inventory.json`。摘要：

| 来源 | 数量 | 说明 |
|---|---|---|
| `dist/data.js` projects | 4 | film / visual / web / culture 分类入口 |
| `dist/data.js` awards | 3 | 仅 image+alt，无独立 id 字段 |
| `src/services/items.js` | 9 | 服务目录（非 Work 主模型，V1.0 后续） |
| `src/hero/images.js` orbit | 8 | 首屏轨道图 |
| hero video projects | 5 | swft-icon, pop-palm, puff, flum-mi, flum-pebble-x |
| hero image projects | 3 | lophthy, vapes-bars, vapx |
| `dist/film-projects.js` | = 有 `videoSrc` 的 hero | 动态派生，**不要写死数量** |
| `dist/visual-projects.js` | 8 | slug 与 V1.1 register 一致 |
| `dist/work-reel-data.js` | film + visual + web + culture | reel 组合切片 |
| `dist/work-detail-data.js` | direction + reel + film + visual | `workDetailOverrides={}` 为空 |
| About collage | 10 | `src/about/reference-data.js` |
| Portal wall | **60** | `wallCards` 循环生成；`wallOverrides` 覆盖 8 张 |

### 2.1 素材存在性

对本机 `dist/assets` 抽查：hero 视频/poster/preview/home-360p 与 image slides **缺失数 = 0**（见 inventory）。  
注意：仓库 `main` 上视频可能仍是未压缩大文件；性能优化在独立 PR 分支，迁移时以实际分支资产为准。

## 3. URL / History 行为（关键结论）

**当前没有独立 `/work/:slug` 路径路由。** Work 是单页 `#work` 区块 + hash/history 叠层：

| 模式 | Hash / API | 模块 |
|---|---|---|
| 区块锚点 | `#work` `#services` `#about` … | components / 导航 |
| 作品详情 | `#case/{id}` + `history.pushState/replaceState`（`marvloreCase`） | `work-detail.js` |
| 画廊 | `#view/{id}`（`marvloreGallery`） | `project-gallery.js` |
| 分类项目快捷 | `#project-{id}` | `app.js` syncRoute |
| Portal | `#marvlore-go` | explore-scene |

`server.mjs` 为纯静态文件服务（pathname → `dist` 文件），**无** `/work/*` SPA fallback。

因此 V1.1 推荐的 `/work/...` **不得在 Phase 0 后直接改路由**；先保持 hash UX，可分享路径需单独产品确认。

完整表：`url-inventory.csv`。

## 4. CMS 与官网错位

| 官网需要 | 当前 CMS | 结论 |
|---|---|---|
| Work 四类 + 项目 + 媒体 | 无 work-* 类型 | 需按 V1.1 **新增** |
| Hero 多档视频 | 无 | V1.0 Hero Item，排在 Work 之后 |
| Services 9 项 | `service-model` 语义不同 | 勿直接复用字段 |
| About 拼贴几何 | `about` 旧营销模型 | 仅可换图文；几何留前端 |
| 联系表单 | `quote-request.create` | 短期可沿用；V1.0 Inquiry 后换 |

## 5. 前端冻结契约（实施时必须遵守）

以下内容**禁止**为接 CMS 而改动：

- `dist/components.js` 区块顺序与 DOM 结构  
- Work reel 物理参数（`workReelOptions`）  
- About collage 坐标 / 旋转 / scatter  
- Explore / Portal 渲染与 Matter 行为  
- GSAP/Motion 时间轴与 class/id  

允许：新增 `src/cms/*` Adapter，把 CMS DTO **归一成现有 ViewModel**；feature flag + 静态 fallback。

## 6. 基线命令

```bash
# 官网
cd marvlore-website-main && pnpm test && pnpm check

# CMS（本阶段未改代码；后续模型阶段再跑）
cd cms-strapi-main && npm run build
```

## 7. 本阶段产出

- `docs/cms-phase0/implementation-audit.md`（本文件）
- `docs/cms-phase0/work-static-inventory.json`
- `docs/cms-phase0/url-inventory.csv`
- `docs/cms-phase0/migration-risks.md`

## 8. 下一步（需确认后才改代码）

1. 备份 `cms-strapi-main/.tmp/data.db` 与 `public/uploads`（本地演练恢复）。  
2. 在**可丢弃库**上设计/验证 V1.1 五个 `work-*` 类型 + i18n 安装计划。  
3. 仍不删除任何既有 Content-Type。
