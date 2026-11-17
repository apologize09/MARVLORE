# 官网素材同步到 Strapi 素材库

时间：**2026-11-17 Asia/Shanghai**

## 目的

把 `marvlore-website-main/dist/assets` 中已有的图片/视频写入 Strapi Media Library（`plugin::upload.file` + `public/uploads`），便于后台「媒体库」浏览与选用。

- **不改** 官网静态路径服务方式  
- **不发明** 文案或新素材  
- 内容类型里的 `*Url` 字符串字段仍保留作官网回退；本脚本只填充素材库

## 命令

```bash
cd cms-strapi-main
# 先停掉占用 SQLite 的 strapi develop / start

npm run sync:site-media                 # dry-run
npm run sync:site-media:execute         # 实际上传

# 可选
npm run sync:site-media:execute -- --images-only
npm run sync:site-media:execute -- --videos-only
npm run sync:site-media:execute -- --limit=20
```

上传后素材落在媒体库文件夹：`marvlore-site/<top-level>/`（如 `hero-video`、`orbit`）。  
`caption` = `/assets/...` 官网路径；`name` = 路径用 `__` 连接，避免重名。

## 关联到内容字段（后台编辑区显示）

素材入库后，还需把 `coverUrl` / `imageUrl` 等字符串匹配到 media 关系字段（`cover` / `image` / …），Content Manager 才会显示缩略图：

```bash
npm run link:site-media                 # dry-run
npm run link:site-media:execute         # 写入 cover/thumbnail/heroMedia/image/video/poster
```

覆盖：`work-project`、`work-project-media`、`work-category`。

## 规模（当前 dist）

约 144 个媒体文件（~124 图 + 20 视频），不含 `fonts/`。
