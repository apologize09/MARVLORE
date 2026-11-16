# CMS Phase 1 — Work 模型设计与验证

对应 V1.1 Phase 1 / 合并路径波次 B。本阶段只新增 `work-*` 内容类型与设计文档，**不删除**既有 CT，**不改**前端布局/动画。

## 产出

| 文件 | 内容 |
|---|---|
| `data-model.md` | 字段表、关系、ERD、静态视频 URL 约定 |
| `permissions-matrix.md` | 角色权限矩阵（Phase 2 落地） |
| `schema-validation.md` | develop/build 与空白/副本库验证记录 |
| `backup-notes.md` | SQLite + uploads 备份路径与校验 |

## 已锁定决策（Phase 0）

- Locales：`zh-CN`（默认）+ `en`
- Work URL：hash（`#case/{id}`）
- 视频：字符串字段引用静态 `dist/assets/hero-video/*`（可并行保留 media 字段）

## i18n 兼容性

- 安装态：`@strapi/i18n@5.52.1` 已随 `@strapi/strapi@5.52.1` 预装，**无需额外安装或升级**。
- bootstrap：`src/index.ts` 确保 locales 存在并将默认设为 `zh-CN`。
- Phase 2 前：**不**向 Public 开放 work-* find（见 permissions-matrix）。
