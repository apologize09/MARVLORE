# 06 — Test & acceptance (P4)

> Branch: `cursor/cms-admin-zh-p4-f441`  
> Date: 2026-11-18 (Asia/Shanghai)

## Automated (this environment)

| Check | Result |
|-------|--------|
| `npm run verify:admin-localization` | Run in PR — must exit 0 |
| Schema structural fingerprint | Fixture `scripts/fixtures/admin-localization-schema-fingerprint.json` |
| Ops zh/en key parity + `t()` resolution | Covered by verify script |
| Active CT `displayName` contains CJK | Covered by verify script |
| Six hubs in `register.ts` | Covered by verify script |
| `npm run build` (admin) | Run before merge |
| `npm run verify:i18n` | Content i18n (existing). This P4 run hit `db.config.connection` undefined while Strapi develop held the env — **待环境空闲重跑**；与 admin UI 字典无关 |

## Manual — 待人工验证

Do **not** treat these as automated pass:

- Login / logout / Profile language switch / refresh language persistence
- Content Manager draft/publish tabs render 草稿 / 已发布 after hard refresh
- Edit Work / Hero / About forms — Chinese field labels; saved content unchanged (EN/CN body intact)
- Upload / preview media; permissions unchanged
- Website frontend (`marvlore-website-main/`) visual smoke after CMS edits
- Console: no new hard errors on `/ops/*` hubs

## Acceptance checklist (pack §9)

### 后台语言

- [x] Admin default locale `zh-Hans` + native override dictionary
- [x] English fallback retained in `config.locales` / ops `en.ts`
- [ ] Profile switch + re-login — 待人工验证

### 自定义后台

- [x] Six hubs: 工作台 / 官网内容管理 / 作品案例管理 / 媒体资源管理 / 内容与 SEO / 系统设置
- [x] Hub copy via typed `t()`
- [x] No fake 媒体同步 / 运行状态 entries

### 模型与字段

- [x] Active Content Types Chinese `displayName`
- [x] Work + site CM field labels CN; shared component labels CN
- [x] UID / attribute names / relations protected by fingerprint

### 范围保护

- [x] Localization work scoped to `cms-strapi-main/`
- [x] No intentional website content translation
