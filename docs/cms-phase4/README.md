# CMS Phase 4 — 静态 Work 数据迁移工具

把官网 `marvlore-website-main/dist` 中的 Work 静态模块转成 CMS 可管理内容。

## 命令

```bash
cd cms-strapi-main
pnpm build   # --execute 前需要

# 默认 dry-run：只生成清单/计划，不写库
node ./scripts/work-migrate/cli.mjs

# 显式写入（幂等：legacyId + locale；默认跳过已存在）
node ./scripts/work-migrate/cli.mjs --execute --database=.tmp/migrate-exec.db

# 覆盖已存在
node ./scripts/work-migrate/cli.mjs --execute --update-existing
```

## 产出（`docs/cms-phase4/artifacts/`）

| 文件 | 说明 |
|---|---|
| `work-migration-inventory.json` | 完整抽取结果 |
| `work-migration-inventory.csv` | 作品清单 |
| `missing-assets.csv` | 磁盘缺失素材 |
| `duplicate-slugs.csv` | 原始重复 slug（计划中会消歧） |
| `work-migration-plan.json` | dry-run 计划 |
| `work-migration-report.json` | `--execute` 对账报告 |

## 规则

- 默认 dry-run；必须 `--execute` 才写入
- `legacyId` 幂等；默认不覆盖（需 `--update-existing`）
- 视频/图片优先写静态路径字符串（`coverUrl` / `videoUrl` 等），不强制上传
- **不编造** `clientName`、`projectYear`、成果文案、未提供翻译

## 分类映射

- L1：`work`
- L2：`film` / `visual` / `web` / `culture`（来自 `dist/data.js`）
