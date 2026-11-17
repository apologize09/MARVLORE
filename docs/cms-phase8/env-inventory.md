# Phase 8 — 环境变量清单（不含值）

**禁止**把真实密钥写入文档、Rules 或 Git。下列仅名称与用途。

## CMS（`cms-strapi-main`）

| 变量 | 必需 | 用途 |
|---|---|---|
| `HOST` | 是 | 监听地址（例 `0.0.0.0`） |
| `PORT` | 是 | 监听端口（例 `1337`） |
| `APP_KEYS` | 是 | Strapi app keys（逗号分隔） |
| `API_TOKEN_SALT` | 是 | API Token 盐 |
| `ADMIN_JWT_SECRET` | 是 | Admin JWT |
| `TRANSFER_TOKEN_SALT` | 是 | Transfer token 盐 |
| `JWT_SECRET` | 是 | Users-permissions JWT |
| `ENCRYPTION_KEY` | 是 | 加密密钥 |
| `DATABASE_CLIENT` | 是 | 当前 `sqlite` |
| `DATABASE_FILENAME` | 是 | 相对路径，例 `.tmp/data.db` |
| `CORS_ORIGIN` | 强烈建议 | 逗号分隔官网源；须含生产域名。代码默认另含本地 `5173`/`4173` |

模板：`cms-strapi-main/.env.example`（占位符，无真实值）。

## 官网（`marvlore-website-main`）

| 变量 | 必需 | 用途 |
|---|---|---|
| `CMS_BASE` | 否 | `server.mjs` 拉 sitemap / 服务端拼 CMS URL；默认 `http://127.0.0.1:1337` |
| （浏览器）`cmsBase` query / `localStorage.marvlore.cmsBase` / `window.__MARVLORE_CMS_BASE__` | 否 | 仅公开 API base；**不要**放管理 Token |

V1.1 包中的 `CMS_READ_TOKEN` / `PUBLIC_CMS_BASE_URL`：**当前实现未使用管理读 Token**；Public Work GET 匿名可读。若日后关闭 Public 读，再由**服务端代理**引入读 Token，且不得下发浏览器。

## 部署提示

- 生产 `CORS_ORIGIN` 收紧为正式官网域名（可另加预发）。
- SQLite 文件与 `public/uploads` 同周期备份。
- 锁版本：Strapi / `@strapi/i18n` **5.52.1**。
