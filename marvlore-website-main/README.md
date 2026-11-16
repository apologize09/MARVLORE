# MARVLORE 迈络官网

这是官网的完整可编辑项目，包含源代码、图片、视频、字体及当前构建结果。

线上地址：https://meadow-laurel-5ejg.here.now/

## 本地预览与修改

安装 Node.js 24 和 pnpm 11.25.0，然后在项目目录运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://127.0.0.1:5173/ 。修改 React 组件后需要重新构建或重启 `pnpm dev`；本项目没有自动热更新。

只预览仓库已经构建好的版本：`node server.mjs`。

## 常用修改入口

| 内容 | 文件或目录 |
| --- | --- |
| 首屏封面、项目图片及视频 | `src/hero/images.js`、`dist/assets/` |
| 首屏卡片入场和旋转 | `src/hero/direct-cylinder-entrance.js`、`src/hero/CircularCarousel.jsx` |
| 首屏标题及版式 | `src/hero/hero-entry.jsx`、`src/hero/hero.css` |
| 创意服务内容和交互 | `src/services/items.js`、`src/services/experience.jsx`、`src/services/experience.css` |
| 品牌介绍 | `src/about/`、`dist/about-cards.js` |
| 精选作品分类与封面 | `dist/data.js`、`dist/visual-projects.js`、`dist/work-reel-data.js` |
| 作品切片、蒙版和悬停 | `dist/work-reel.js`、`dist/work-reel.css`、`dist/work-interactions.css` |
| 项目详情 | `dist/work-detail-data.js`、`dist/work-detail.js`、`dist/project-gallery.js` |
| 漂浮卡片与作品墙 | `dist/explore-*.js`、`dist/wall-cards.js`、`dist/wall-tone.js` |
| 荣誉 | `dist/data.js`、`dist/award-effects.css`、`dist/motion.js` |
| 联系页 | `src/contact/` |
| 导航 | `src/navigation/` |
| 全站字体 | `dist/fonts.css`、`dist/assets/fonts/` |

部分模块直接维护在 `dist/`，不要把整个目录删除后重建。`src/` 内组件会通过构建脚本生成对应文件，优先修改其源文件。

详细设计约定见 `AGENTS.md`。较早的开发记录见 `docs/development-history.md`，其中旧版服务标签、入场流程与字体描述已被当前实现替代。

## 协作流程

1. 从最新 `main` 创建自己的修改分支。
2. 修改文字、素材、布局或动画，在本地预览。
3. 运行 `pnpm test`、`pnpm build`、`pnpm check`。
4. 提交源文件和本次生成的 `dist/` 文件，通过 Pull Request 合并。
5. 有写入权限的协作者可进入 **Actions → Publish website → Run workflow**，选择要发布的分支并勾选确认发布。

提交或合并代码不会自动修改线上网站；手动运行发布流程才会上线。发布流程不设置必须由仓库所有者审批的步骤。暂不邀请协作者，之后由仓库所有者在 Settings → Collaborators 添加。

## 首次启用发布

仓库所有者在 Settings → Secrets and variables → Actions 添加加密凭据 `HERENOW_API_KEY`，值为有权更新现有官网的 here.now API key。不要把密钥写进源码、文档或普通变量。

站点配置位于 `deployment.json`。本流程更新原网址，不创建另一个站点，也不修改网站访问权限。发布使用的密钥应由网站所有者明确授权提供给此私有仓库。here.now 的 API key 为账户级凭据；拥有仓库写入权限的人能够修改发布流程，因此应视为具备该凭据的使用权限。

没有发布密钥时，源码编辑、本地预览和自动检查仍可使用，发布流程会明确报错而不会宣称成功。

发布前可运行 `node scripts/publish-here-now.mjs --dry-run` 检查发布目录；实际发布后，流程会核对线上文件，并在运行结果中显示网址和版本号。

## 素材

`dist/assets/` 中包含官网使用的素材。保留字体及第三方组件的版权说明。仓库保持私有，不附带旧发布账户配置、验证码或登录凭据。

## 可选：媒体 CDN

默认媒体与页面同域发布到 here.now（已由 Cloudflare 边缘加速）。若要把字体 / 图片 / 视频迁到独立源：

1. 将 `dist/assets/` 原样同步到 CDN（或 R2 等），路径保持 `/assets/...`。
2. 在 `deployment.json` 设置 `mediaCdnBase`（例如 `https://media.example.com`），或构建时设置环境变量 `MEDIA_CDN_BASE`。
3. 运行 `pnpm media:cdn`（已含在 `pnpm build` 末尾）：会把 `./assets/` 引用改写为 CDN 绝对地址，并更新 `dist/media-cdn.js`。
4. 用 `pnpm media:cdn:list` 查看待同步素材清单（不会上传）。

`mediaCdnBase` 留空时保持相对路径，本地与 here.now 行为不变。独立 CDN 需允许跨域字体（CORS / `Access-Control-Allow-Origin`）；本地 `server.mjs` 已对媒体响应加上跨域头，便于把本机当作临时媒体源调试。
