# 字体源文件（不进入发布目录）

将官方 **OPPO Sans 4.0** TTF 放在本目录，文件名：`OPPOSans4.0.ttf`。

下载：https://www.coloros.com/article/A00000074/

重建站点用子集：

```sh
pnpm subset:font
```

生成物：`dist/assets/fonts/OPPOSans4.0-subset.woff2`（由 `dist/fonts.css` 引用）。
