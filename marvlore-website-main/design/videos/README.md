# 英雄区视频源文件

将未压缩的 master 放到 `hero-source/{slug}.mp4`，然后运行：

```sh
bash scripts/compress-hero-videos.sh
# 或
pnpm compress:videos
```

生成档位（写入 `dist/assets/hero-video/`）：

| 文件 | 用途 |
| --- | --- |
| `*-home-360p.mp4` | 首屏卡片循环 |
| `*-preview.mp4` | 短预览 |
| `*.mp4` | 详情默认 720p |
| `*-1080p.mp4` | 可选高清 |

站点数据字段：`homePreviewSrc` / `previewSrc` / `videoSrc` / `videoSrcHd`。
