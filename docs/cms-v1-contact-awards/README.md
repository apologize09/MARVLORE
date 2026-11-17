# CMS V1.0 — Contact + Awards（回补第一波）

叠在 V1.1 Work 完成态之上；**不**新建 `project*`（已由 `work-*` 覆盖）。

## CMS

| 类型 | UID | Public |
|---|---|---|
| Global Setting（single） | `api::global-setting.global-setting` | `find` |
| Award（collection） | `api::award.award` | `find` / `findOne`（仅 published + `isActive`） |

种子（静态事实，不编造）：

```bash
cd cms-strapi-main
npm run seed:site              # dry-run
npm run seed:site:execute -- --database=.tmp/data.db
```

## 官网 Adapter

- Flag：`?cmsSite=contact|awards|all`（或 `cmsWork=all` 顺带开启）
- `getContact()` / `getAwards()` 经现有 bundle；失败回静态
- Contact DOM/动效不变，仅文案字段可替换
- Awards 轮播仍用现有 `createAwardsCarousel`；图为静态 asset 文件名

## 预览

```
http://127.0.0.1:5173/?cmsSite=all&cmsBase=http://127.0.0.1:1337#awards
http://127.0.0.1:5173/?cmsSite=contact&cmsBase=http://127.0.0.1:1337#contact
```

## 下一步（V1.0）

Services → About → Hero → Explore → Portal → Inquiry
