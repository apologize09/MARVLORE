# CMS Phase 8 — 回归、部署与交接

对应 V1.1「Phase 8 — 回归、部署与交接」。本阶段产出**验收与交接文档**；**不**执行生产库迁移、生产发布或删除静态数据（需另行确认）。

记录时间：**2026-11-17 09:37 Asia/Shanghai**（机器 UTC 2026-11-17T01:37Z）  
基线分支：`cursor/cms-i18n-seo-cache-f441`（Phase 7 / PR #19）

## 产出

| 文件 | 内容 |
|---|---|
| `acceptance-record.md` | 功能验收记录（对照 V1.1 `09-acceptance-test`） |
| `migration-reconciliation.md` | 静态源 ↔ CMS 条目对账 |
| `url-redirect-table.md` | Hash / query 兼容与 `/work/*` 延期表 |
| `env-inventory.md` | 环境变量清单（**不含值**） |
| `backup-restore-drill.md` | SQLite / uploads 备份恢复演练 |
| `deploy-rollback.md` | 部署与回滚步骤 |
| `open-risks.md` | 未完成事项与风险 |

## 本地回归命令（已跑通）

官网（`marvlore-website-main`）：

```bash
pnpm check   # exit 0
pnpm test    # 113 pass
pnpm build   # exit 0
```

CMS（`cms-strapi-main`）：

```bash
npm run verify:i18n   # ok（zh-CN 默认 + en）
npm run build         # exit 0（admin panel）
```

## 约束回顾

- 不升级 Next.js / Strapi（锁 **5.52.1**）
- 不破坏 Work DOM / CSS / 动效冻结面
- 迁移 CLI 默认 dry-run；生产执行需确认
- 浏览器不得出现管理 Token / 密钥
