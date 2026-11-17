# Phase 8 — 部署与回滚步骤

**未经确认不执行生产发布。** 以下为交接用 runbook。

## 组件

| 组件 | 路径 | 运行 |
|---|---|---|
| CMS | `cms-strapi-main` | Strapi 5.52.1，SQLite + local uploads |
| 官网 | `marvlore-website-main` | 静态 `dist` + `server.mjs`（或等价静态托管） |

## 推荐上线顺序（预发 → 生产）

1. **备份** 现网 DB + uploads（见 `backup-restore-drill.md`）。
2. 部署 CMS 代码 → `npm ci` → `npm run build` → 配置 `.env`（无密钥入库）→ 启动。
3. `npm run verify:i18n`；抽样 `GET /api/work-projects`、`/api/work-cache-version`、缓存响应头。
4. 如需灌数：先在副本 `migrate:work` dry-run → 审查 → **确认后** `--execute`；再 `i18n:work` dry-run → execute。
5. 部署官网静态资源；`CMS_BASE` / 浏览器 `cmsBase` 指向**公开** CMS origin。
6. CORS：`CORS_ORIGIN` 仅正式域名（+ 必要预发）。
7. 冒烟：`?cmsWork=all` 总览/筛选/详情/中英切换/sitemap；默认无 flag 仍走静态。
8. 观察缓存版本戳：后台改稿后 `work-cache-version` 应递增，前端轮询清缓存。

## 功能开关

- 默认 **CMS off**（静态）：回滚面最小。
- 灰度：预发或内网加 `cmsWork=all&cmsBase=…`。
- 全量：再考虑把默认 base/stage 写入受控配置（仍禁止管理 Token 进浏览器）。

## 回滚

| 场景 | 动作 |
|---|---|
| 官网异常、CMS 正常 | 回滚官网静态产物；或去掉默认 `cmsWork`，用户回静态 |
| CMS API 异常 | 官网关 CMS flag / 清 `cmsBase`；静态 fallback 继续服务 |
| CMS 数据错误 | 停写 → 恢复 DB+uploads 快照 → 重启 Strapi → 核对计数 |
| Schema / 构建失败 | 回滚 CMS 镜像/提交到上一已知好版本；**不要**在未备份库上强迁 |

## 明确不做（本阶段）

- 生产 DB migrate execute
- 删除静态 Work 数据源
- Strapi / Next 升级
- 启用 `/work/*` 路径替换 hash
