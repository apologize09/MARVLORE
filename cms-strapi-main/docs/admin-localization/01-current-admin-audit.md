# 01 — Current Admin Audit (P0)

> Date: 2026-11-18 (Asia/Shanghai)  
> Branch: `cursor/cms-admin-zh-p0-f441`  
> Base commit: `32770a58795ad2d14f8a5d4204d066d7f7d645b1` (main @ PR #42 merge)  
> Scope: read-only audit for CMS admin localization V1.0

## 1. Git / workspace

| Item | Value |
|------|--------|
| Branch | `cursor/cms-admin-zh-p0-f441` (from `origin/main`) |
| HEAD | `32770a5` Merge PR #42 soft category filter |
| Dirty | `cms-strapi-main/.tmp/data.db` (local runtime DB; expected) |
| Website tree | Not modified in this phase |

## 2. Versions

| Package | Version (from `package.json`) |
|---------|--------------------------------|
| `@strapi/strapi` | **5.52.1** |
| `@strapi/plugin-users-permissions` | 5.52.1 |
| `@strapi/plugin-cloud` | 5.52.1 |
| React / react-dom | ^18 |
| TypeScript | ^5 |
| better-sqlite3 | 12.8.0 |
| Node engines | `>=20 <=26` |
| Runtime Node | see `node -v` in CI/agent |

No custom plugins under `src/plugins/`. Components: `src/components/shared/` (e.g. SEO).

## 3. Admin entry & locale state

**File:** `src/admin/app.tsx`

- Default admin UI locale: `zh-Hans` (storage key `strapi-admin-language`)
- Translations merged: `marvloreBrandTranslations` + Content Manager type name overrides
- Ops menu registered via `registerOpsMenu`
- Extra bootstrap: `installWorkCategoryListUx` (Work list category select; unrelated to i18n package but present)

**Gap vs localization pack:** no dedicated `src/admin/extensions/i18n/` dictionary yet; ops menu intl defaults still English (`Dashboard`, `Work Studio`, …).

## 4. Custom ops pages

| Route | Module | Title (hardcoded EN) |
|-------|--------|----------------------|
| `/ops/dashboard` | `modules/dashboard.tsx` | Dashboard |
| `/ops/website` | `modules/website.tsx` | Website Management |
| `/ops/work` | `modules/work-studio.tsx` | Work Studio |
| `/ops/media` | `modules/media.tsx` | Media Library |
| `/ops/system` | `modules/system.tsx` | System |

**Registration:** `extensions/ops/register.ts` (`app.addMenuLink`)  
**Links/labels:** `extensions/ops/routes.ts` — Work links partly Chinese; Website links mostly English (`Hero`, `About`, `Services`…).  
**Shared UI:** `extensions/ops/ui.tsx`

## 5. Content Types (schema `info.displayName`)

| UID | Current displayName | Pack suggestion |
|-----|---------------------|-----------------|
| about-page | About | 关于我们页面 |
| article | （归档）Article | 文章 |
| author | （归档）Author | 作者 |
| award | Awards | 奖项 |
| certification | （归档）Certification | 认证资质 |
| category | （归档）Category | 文章分类 |
| faq | FAQ | 常见问题 |
| global-setting | Contact | 全局网站配置 |
| hero-item | Hero | 首页主视觉 |
| page-seo | SEO | SEO配置 |
| service-item | Services | 服务项目 |
| work-category | 分类 | 作品分类 |
| work-page | 作品总览 | 作品页面配置 |
| work-project | 作品 | 作品案例 |
| work-project-media | 详情媒体 | 关联素材 |
| work-tag | 标签 | 作品标签 |

**Attribute `displayName` in schema.json:** none set (all `null`).  
**How CM edit labels actually work in this project:** Content Manager core-store `metadatas.<field>.edit.label` (see existing patches for category / project).

## 6. Work Project CM labels (screenshot gap)

From core-store `…work-project.work-project` (local DB):

| Field | edit.label (now) | Target (CN) |
|-------|------------------|-------------|
| title | title | 标题 |
| slug | slug | 别名 / URL 标识 |
| subtitle | subtitle | 副标题 |
| eyebrow | eyebrow | 眉题 |
| summary | summary | 摘要 |
| description | description | 描述 |
| category | 所属分类 | 所属分类 (done) |
| categoryNameCn | 所属分类中文名 | done |
| tags | tags | 标签 |
| cover / thumbnail / heroMedia / video | English | 封面 / 缩略图 / 主视觉媒体 / 视频 |
| *Url fields | `*Url（静态回退）` | keep 静态回退 + CN name |

List view already has some CN (`标题`, `副标题`, `所属分类`).

## 7. Content language vs admin UI

- Content i18n locales: `zh-CN` / `en` (entries)
- Admin UI locale: `zh-Hans`
- Scripts: `verify:i18n`, `i18n:work`, seed/align/migrate — **do not run** without approval (per pack)

## 8. Risks / 待核实

1. Nested admin menu groups (pack §2) may need Strapi 5.52.1-compatible approach — **do not DOM-hack**; design in P3 after API check.
2. Schema attribute `displayName` is not used today; prefer CM metadatas (proven) for field labels.
3. Native Strapi Admin zh-Hans coverage incomplete; need key extraction in P1 (do not copy other major versions).
4. Soft Work category filter (`work-category-list.ts`) is DOM-based; keep isolated from i18n pack.

## 9. Recommended next edits (this iteration)

1. Patch **work-project** CM edit/list labels → Chinese (user screenshot).
2. Align **schema info.displayName** for active models toward pack table (metadata only).
3. Write follow-up docs stubs; full P1/P2/P3 menu regroup deferred.

## 10. Explicit non-actions (P0)

- No `reinit:local`, migrate, seed, sync execute.
- No website / API contract / UID / attribute name changes.
- No dependency upgrades.
