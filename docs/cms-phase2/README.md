# CMS Phase 2 — Work 后台校验与 Public 只读

叠在 Phase 1 schema 之上：服务端业务规则 + Public find 权限。前端布局/动画仍冻结。

## 实现

| 模块 | 作用 |
|---|---|
| `src/utils/work-rules.ts` | 分类层级、标签适用性、作品归属、媒体块、删除保护 |
| `src/middlewares/work-document-rules.ts` | Document Service `create/update/delete` 中间件 |
| `src/index.ts` | 注册中间件；Public 开放 work-* find |
| work-* controllers | REST 强制 `isActive` / 活跃分类过滤 |

## 规则摘要

1. Category：仅两级；L1 禁止 parent；L2 必须 parent 且 parent 为 L1  
2. Tag.categories 只能指向 L2  
3. Project.category 必须为启用中的 L2；有 scoped tags 时必须适用  
4. Media `blockType` 与字段一致；embed 默认关闭（`WORK_EMBED_HOST_ALLOWLIST`）  
5. 有子分类或作品时禁止硬删分类；被 relatedProjects 引用时禁止硬删作品  
6. Public API：find/findOne（page 仅 find）；Draft&Publish 仍只返回已发布

## 验证脚本

```bash
cd cms-strapi-main
pnpm build
node ./scripts/verify-work-rules-unit.mjs
node ./scripts/verify-work-rules-integration.mjs
```
