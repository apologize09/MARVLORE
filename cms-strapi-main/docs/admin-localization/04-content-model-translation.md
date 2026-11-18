# 04 — Content Model Translation (partial — Work fields first)

## Approach

Strapi 5.52.1 Content Manager **edit form labels** come from core-store:

`plugin_content_manager_configuration_content_types::<uid>` → `metadatas.<attr>.edit.label`

Schema attribute `displayName` is not used in this repo. Schema `info.displayName` is updated for sidebar type names.

## Applied this iteration

### Schema `info.displayName`

See pack table; active models renamed (e.g. `作品案例`, `作品分类`, `关于我们页面`…).

### CM field labels (script)

`scripts/patch-work-project-field-labels-cn.mjs --execute`

Covers:

- `work-project` — title/slug/subtitle/cover/thumbnail/heroMedia/… → 中文
- `work-category`, `work-tag`, `work-project-media`, `work-page`

### Screenshot mapping

| Was (EN) | Now (CN) |
|----------|----------|
| title | 标题 |
| slug | 别名 |
| subtitle | 副标题 |
| thumbnail | 缩略图 |
| heroMedia | 主视觉媒体 |
| cover | 封面 |
| video | 视频 |
| tags | 标签 |

## Not yet

- Full field translation for About / Hero / Services / Awards / Contact / FAQ / SEO
- Nested component field labels (`shared.seo`, etc.)
- Native Strapi Admin chrome (Publish tabs DRAFT/PUBLISHED, ENTRY, PREVIEW) — P1
