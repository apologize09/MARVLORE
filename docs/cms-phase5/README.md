# CMS Phase 5 — 官网 Work Adapter

在现有静态官网上增加 CMS 数据适配层：**API client / normalize / cache / fallback / feature flag**。  
默认仍走静态数据；开启 flag 后才拉 Phase 3 Public API，并映射到现有 Work ViewModel。  
**不改** Work DOM 结构、CSS、reel 物理参数或动效。

## 模块（`marvlore-website-main/dist/cms/`）

| 文件 | 职责 |
|---|---|
| `config.js` | `cmsWork` / `cmsBase` / locale / timeout（query + localStorage） |
| `http.js` | 带 timeout + 可重试的 GET |
| `work-cache.js` | 进程内 TTL cache |
| `work-api.js` | Phase 3 公共读 API 封装 |
| `work-normalize.js` | DTO → overview / reel / detail ViewModel |
| `work-fallback.js` | 静态 `data.js` / reel / detail 打包 |
| `work-loader.js` | 按 stage 渐进拉取并合并 |
| `work-runtime.js` | 可变 store + `bootWorkBundle()` |

消费者：`app.js`（首屏前 `await bootWorkBundle()`）、`components.js` Work、`work-reel.js`、`work-detail.js`。

## Feature flag

| 值 | 行为 |
|---|---|
| `off`（默认） | 全静态 |
| `categories` | 分类 / Overview 卡片 |
| `list` | + 作品列表 → reel |
| `detail` / `all` | + 详情与媒体块 |

启用示例：

```
http://127.0.0.1:4173/?cmsWork=categories&cmsBase=http://127.0.0.1:1337
localStorage.setItem('marvlore.cmsWork', 'list')
```

失败时自动 `static-fallback`（`document.documentElement.dataset.cmsWorkSource`）。

## CORS

浏览器从官网 origin（默认 `http://127.0.0.1:5173`）拉 CMS 时，需要 Strapi `strapi::cors` 放行该 origin。  
`cms-strapi-main/config/middlewares.ts` 默认已包含 `5173` / `4173`；也可用环境变量：

```
CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
```

## 验证

```bash
cd marvlore-website-main
pnpm test
pnpm check
# 可选：对照静态与 CMS
# 不开 flag → 与线上一致
# ?cmsWork=categories → Overview 文案可来自 CMS，DOM 不变
```

## 冻结契约

- 不改 Work section DOM / class / id
- 不改 `workReelOptions` 物理参数
- 不在浏览器暴露 admin token
- 静态模块保留，作为永久 fallback
