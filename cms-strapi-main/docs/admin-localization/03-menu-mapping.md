# 03 — Ops menu mapping (P3)

## Constraint (Strapi 5.52.1)

`app.addMenuLink()` is **flat** (no nested children API). Nested six-group trees cannot be registered as expandable sidebar folders without unsupported DOM hacks.

**Compatible approach:** six top-level hub links; each hub page lists the pack subsections as cards deep-linking to Content Manager / Settings / Media Library.

## Mapping

| Pack group | Hub route | Cards / notes |
|------------|-----------|---------------|
| 工作台 | `/ops/dashboard` | Stats + shortcuts |
| 官网内容管理 | `/ops/website` | 首页管理、关于我们、服务项目、联系与站点配置、常见问题、奖项、认证资质（归档） |
| 作品案例管理 | `/ops/work` | 作品列表、作品分类、作品标签、作品频道页、作品素材 |
| 媒体资源管理 | `/ops/media` | 全部素材、图片、视频、文件（均进媒体库；库内筛选）。**媒体同步**：仅有 CLI `sync:site-media`，**暂不展示**后台入口 |
| 内容与 SEO | `/ops/seo` | 文章、文章分类、作者、页面 SEO（归档文章模型保留入口） |
| 系统设置 | `/ops/system` | 管理员、角色与权限、多语言、API 权限、系统信息。**运行状态**：当前无独立页，**暂不展示** |

## Not done

- True nested sidebar folders (blocked by Admin API)
- Hiding native Content Manager / Media / Settings entries (forbidden by pack)
