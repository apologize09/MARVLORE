# Marvlore 官网 ↔ CMS 打通 & Phoenix 清理

时间：**2026-11-17 10:10 Asia/Shanghai**

## 做了什么

1. **默认接通 CMS**：官网 `cmsWork=all` + `cmsSite=all`（可用 `?cmsWork=off` 回静态）
2. **清除 Phoenix Pouch 遗留数据**：article/author/category/certification/faq/page-seo 文档 + 相关 uploads
3. **删除重复 Single Types**：移除 `About` / `Global` API（保留 `About Page` / `Global Setting`）
4. **Public 权限**只引导 Marvlore Work / V1.0 类型
5. 备份：`cms-strapi-main/.backups/pre-phoenix-clean-20261117/data.db`（gitignored）

## 命令

```bash
cd cms-strapi-main
npm run purge:phoenix              # dry-run
npm run purge:phoenix:execute -- --database=.tmp/data.db
# 本地后台用开发模式（可改 Content-Type）；生产再用 npm run build && npm run start
NODE_ENV=development npm run develop

cd ../marvlore-website-main
CMS_BASE=http://127.0.0.1:1337 node server.mjs
# 打开 http://127.0.0.1:5173/
# 后台 http://127.0.0.1:1337/admin
```

## 注意

- `npm run seed:example` 已拒绝执行（`About`/`Global` CT 已删除）；不要对迈络库跑 Phoenix seed
- 迈络内容种子：`migrate:work` / `seed:site` / `seed:services` / `seed:about` / `seed:hero`
- 后台界面：默认简体中文；可见品牌文案为 **MARVLORE**（`src/admin/extensions/marvlore-brand.ts`）
- 运营菜单（按工作习惯，而非纯 API 名）：`Dashboard` / `Website Management` / `Work Studio` / `Media Library` / `System`  
  实现：`cms-strapi-main/src/admin/extensions/ops/`（模块拆分，对齐官网 `build-hero|about|services|contact|work.mjs` 边界；不要把各模块编辑逻辑塞进单一控制器）
- 本地后台登录：`cms-strapi-main/.tmp/admin-credentials.txt`（gitignored）。勿在 `strapi develop` 运行中 `git checkout` 覆盖 `.tmp/data.db`，否则 SQLite 会变成只读，登录写入 `strapi_sessions` 失败（HTTP 500），随后触发限流（429）。开发环境登录限流已放宽（见 `config/admin.ts`）。
