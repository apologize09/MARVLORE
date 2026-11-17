# Phase 8 — 数据迁移对账

来源：`docs/cms-phase4/artifacts/work-migration-inventory.json`  
目标库：`cms-strapi-main/.tmp/data.db`（本地跟踪库）  
时间：**2026-11-17 09:37 Asia/Shanghai**

## 计数对照（zh-CN published）

| 实体 | 静态 inventory | CMS published (documentId) | 备注 |
|---|---:|---:|---|
| Categories L1 | 1 | 1 | slug `work` |
| Categories L2 | 4 | 4 | film / visual / web / culture |
| Categories 合计 | 5 | 5 | 一致 |
| Tags（inventory 行） | 13 | — | inventory 含 **1 条重复 slug** `t-e59381e7898ce8a7` |
| Tags（unique slug） | 12 | 12 | 一致 |
| Projects | 19 | 19 | `legacy_id` 均有；一致 |
| Media items（inventory） | 2 | （work-project-media） | Phase 4 planCounts.mediaItems=2 |
| Missing assets | 0 | — | inventory `missingAssets=0` |

## 英文 locale

| 实体 | en published documentId |
|---|---:|
| Categories | 5 |
| Tags | 12 |
| Projects | 19 |
| Work pages | 1 |

EN 由 `npm run i18n:work:execute` 写入；拉丁字段保留，纯中文字段留空；**关联 category/tags 已随 upsert 保留**（否则公开列表因 `category.isActive` 过滤会变成 0）。

## Phase 4 最近报告摘要

`work-migration-report.json`（幂等跳过跑）：

- `created`: 全 0
- `skipped`: categories 5 / tags 13 / projects 19 / media 2
- `failed`: `[]`
- `planCounts.missingAssets`: 0

## 对账结论

- zh-CN Work 主数据与静态源 **对齐**（tags 按 unique slug）。
- en 与 zh-CN documentId **一一对应**（同 document 多 locale）。
- 未删除静态 `dist` 数据源；官网默认仍可无 CMS 运行。
