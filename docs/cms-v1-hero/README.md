# CMS V1.0 — Hero

## CMS

- Collection `hero-item`
  - `role`: `project`（首屏轮播）| `orbit`（轨道静图）
  - 媒体用 **静态 URL 字符串**（不强制 uploads）
- Public：`GET /api/hero-items?locale=zh-CN`（可选 `role=project|orbit`）

```bash
cd cms-strapi-main
npm run seed:hero
npm run seed:hero:execute -- --database=.tmp/data.db
```

种子：8 orbit + 5 video projects + 3 image projects（对齐 `src/hero/images.js`）。

## 官网

- `?cmsSite=hero|all`
- `window.__MARVLORE_HERO_PROJECTS__` / `__MARVLORE_HERO_IMAGES__`
- `mountHeroOrbit` / gallery `brandProjects` 读 CMS；失败回静态
- **不改** carousel / cylinder / title motion

## 预览

```
http://127.0.0.1:5173/?cmsSite=hero&cmsBase=http://127.0.0.1:1337#home
```

## 下一步

Explore → Portal → Inquiry
