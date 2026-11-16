# MARVLORE 迈络官网

**持续约定：用户未单独提出手机端需求时，只开发和验证桌面网页端。** 原有响应式样式保留为兜底，不主动增加手机端工作。

根据「网站平面10.26.2.jpg」搭建的官网。主体为原生 HTML / CSS / JavaScript，第一屏使用独立 React Bits CircularCarousel 与 SplitText 组件，打包为本地静态资源。可继续放入 GitHub 管理。

## 本地运行

安装 Node.js 后，直接预览已构建网站：

```sh
node server.mjs
```

浏览器访问 http://127.0.0.1:5173 。修改第一屏组件时先 `pnpm install`，然后 `pnpm build`；`pnpm dev` 会构建后启动预览。

## 分屏与修改入口

| 分屏 | 页面锚点 | 组件 |
| --- | --- | --- |
| 01 首屏光环 | `#home` | `Hero` |
| 02 服务标签 | `#services` | `Services` |
| 03 迈络介绍 | `#about` | `About` |
| 04 四类作品 | `#work` | `Work` |
| 05 滚动探索 | `#explore` | `Explore` |
| 06 作品墙 | `#marvlore-go` | `Portal` |
| 07 荣誉 | `#awards` | `Awards` |
| 08 联系 | `#contact` | `Contact` |

- `dist/components.js`：各屏独立组件及结构。
- `dist/data.js`：作品数据、文案及素材路径。
- `dist/styles.css`：各屏样式、移动端布局、入场动画和减少动态效果支持。
- `dist/layout.css`：新版网页端适配及统一尺寸参数；后续比例修改优先在此文件进行。
- `dist/app.js`：作品详情弹窗、服务筛选、荣誉轮播、浮动导航和邮箱复制。
- `dist/assets/`：从用户平面图裁出的 WebP 素材；无外部素材依赖。
- `.openai/hosting.json`：当前 Sites 项目的私有部署配置，继续发布时保留项目 ID。

## 首版范围

首页所有文案、服务按钮、四个作品卡片、数据、联系板块均为网页元素。光环、上下弧形作品组、探索区作品群、作品墙和奖项为原图中拆分的合成视觉素材。后续若需卡片逐张飞入、环绕旋转或真正三维运动，应使用独立图层/原始素材替换合成图。

首屏与作品卡片均可打开全屏项目浏览页，未添加虚构案例正文。后续可继续替换项目素材和名称。电话/邮箱入口使用参考图上的信息。留言入口调用邮件应用，不含服务器表单。荣誉内容按参考设计呈现。

## GitHub

项目结构可直接提交 GitHub；当前 Sites 托管源仓库由 Sites 提供，并非用户的 GitHub 仓库。若希望迁移或同步 GitHub，可指定目标仓库后继续配置。GitHub Pages 可直接将 `dist/` 作为静态站点发布目录。

## 服务标签的独立编辑

服务区使用用户「标签.png」逐项拆分的原始素材，不再使用重绘 SVG 或字体符号。21 项均为独立元素；10 个图形贴纸保留原图，11 个文字标签保留原底形，文字使用可编辑的 OPPO Sans。原始参考保存在 `design/references/service-tags.png`，页面不使用整张图片铺图。

- `dist/service-tags.js`：通过 `id` 定位单项，`text` 改文字，`color` 改字色，`fontScale` 改字号，`category` 设置点击筛选（film / visual / web / culture）。`box:{x,y,width,height}` 可覆盖位置及尺寸，单位为原图 3450×954 画布上的像素，缩放由浏览器自动计算。添加 `fill` / `border` 可按新的设计要求覆盖该项底色与边框；未配置时保留原素材。
- `dist/service-tag-assets.js`：记录每个原素材的裁切边界和独立路径；`dist/assets/service-tags/original/` 保留原始 RGBA 切片及标签空白底形。笑脸、星形和环形改用用户提供的独立透明贴纸，原件保存在 `dist/assets/service-tags/stickers/`，显示时通过 CSS 转为灰度，环形旋转以匹配原位置。可通过 `asset` 或 `background` 单独替换素材。
- `scripts/slice-service-tags.py`：从原透明 PNG 自动识别三排素材并逐个裁切，保留原边缘和透明度。标签底形仅清除内部独立文字像素，轮廓和描边不重绘；PNG 完整原件仍另存。该可选脚本需 Pillow / NumPy，网站运行无需 Python。
- `src/services/experience.jsx` 和 `src/services/experience.css`：桌面第二屏滚动时，标题居中逐词显现并消退；标签从屏幕上方依次落入，由 Matter.js 模拟碰撞和拖动。标签内容和素材仍由 `dist/service-tags.js` 独立配置。运行 `node scripts/build-services.mjs` 生成服务区资源。
- 标签物理参考 React Bits 的 FallingText 与 Matter.js 官方弹性碰撞示例：使用固定时间步、适度弹性和空气阻力，随机位置依次投放；碰撞时产生短暂、幅度受控的挤压和恢复，物理底边与屏幕底边对齐。标签尺寸、字形及碰撞范围统一为原始尺寸的 74.75%，可在 `src/services/experience.css` 通过 `--service-tag-scale` 调整。`src/services/tag-physics.js` 在生成位置被占用时等待投放，限制碰撞后的向下加速度；显示使用浏览器刷新时钟和物理帧间插值。`tests/service-physics.test.mjs` 验证不同刷新率的轨迹一致、21 项完整落地、无向下速度突增以及碰撞回弹后的稳定性。
- `src/vendor/react-bits/ScrollReveal.jsx` 与 `ScrollReveal.css` 保留 React Bits 注册表原始 JS-CSS 源码；`src/services/ScrollReveal.jsx` 在原组件上增加滚动触发区域参数以适配第二屏。Matter.js 依赖版本记录于项目依赖清单。
- `dist/service-tags.css`：控制各标签的原始尺寸、图片与 OPPO Sans 字体；`src/services/experience.css` 控制滚动场景及物理阶段样式。

例如只改“脉络文化”：找到 `id:'culture'`，修改 `text` / `fontScale`；若要扩大标签，添加 `box:{width:460}`。当前通过源码逐项编辑，未添加页面管理后台。除非用户另行明确指定，后续文字统一使用 OPPO Sans。

## 网页适配与卡片填充（第二版）

桌面内容最大宽度 1480px；分屏空间以视口高度为基础，介绍区上下作品弧共用一个舞台。作品区在桌面为两列，在 520px 以下为单列；卡片等高、图片填充剩余空间，内容保持可独立替换。

常用参数在 `dist/layout.css` 顶部：`--page-max`（页面最大宽度）、`--screen-padding`（分屏上下边距）、`--card-height`（作品卡片高度）、`--card-gap`（间距）、`--card-radius`（圆角）、`--card-padding`（内边距）。

在 `dist/data.js` 的每个作品对象中填写 `image`（assets 内的图片名）、`title`、`cn`、`description`、`detail` 即可替换内容。默认图片为 `imageFit: 'cover'` 铺满，可在作品对象中改为 `imageFit: 'contain'` 完整展示，并设置 `imagePosition: '50% 50%'` 调整焦点。将 `image` 设为空字符串会显示待填充占位，详情预览也可正常打开。填充通过源文件进行，本版没有新增网页管理后台。

按 Apple Design 原则收敛悬停幅度，提供即时按压反馈，并支持减少动态、减少透明度和增强对比度设置。

## 桌面交互（第三版）

- 作品卡片：按下立即反馈，松开后弹簧复位；点击后图片从来源卡片连续展开至全屏项目浏览页，关闭时返回对应来源位置并恢复键盘焦点。支持返回按钮、关闭按钮、Esc、浏览器前进/后退；项目在全屏页中左右拖动切换。
- 弹簧动画：保留当前位置和速度，进行中的展开、关闭和拖动均可反向，不锁定输入。普通动作使用临界阻尼，只有带释放速度的手势使用轻微回弹。
- 荣誉区：鼠标按下可抓住正在运动的卡片，横向拖动与指针同步，松手结合近期速度投射并吸附。支持循环浏览、上一项/下一项按钮、分页按钮与左右方向键；竖向滚动不受阻挡。
- 作品分类：就近切换分类，选择状态明确，卡片重新排列从当前可见位置过渡。
- 导航：跟随当前分区更新位置指示，浮层材质保持内容层级。
- 系统偏好：减少动态时直接到达状态；减少透明度与增强对比度设置保留可读反馈。

`dist/motion.js` 集中管理解析弹簧、拖动速度、吸附、预览和导航行为；`dist/interactions.css` 管理材质和静态交互状态。可修改 `Spring` 的 `response` / `damping` 调整手感，素材配置仍在 `dist/data.js`。

`node --test tests/motion.test.mjs` 验证反向时的位置/速度连续性、稳定收敛、速度过期保护、惯性吸附限制、边界阻力和减少动态模式。

## 第一屏 CircularCarousel

全站可编辑卡片统一使用 **圆角半径 = 短边 × 8%**。`dist/card-shape.js` 为共享规则；首屏按原始卡宽高计算，三维透视和缩放时圆角随卡片一起变化，其他作品、图片与联系卡片通过 ResizeObserver 按未变换的 border box 尺寸更新。动态详情图片与窗口变化同样遵循此规则。未来新增卡片添加 `data-card-shape` 即可；按钮、标签、导航等控件保持各自形状。

已获取 React Bits **CircularCarousel JS-CSS** 的官方 registry。原始 JSON、JSX、CSS 逐字保存在 `src/vendor/react-bits/`；registry 没有额外依赖，直接使用现有 React / React DOM 和 esbuild。

- `src/hero/hero-entry.jsx`：当前首屏入口，使用 `preset="cylinder"`、`intro="fly"`、`speed=14`、`captions=true`，复用原有 8 张品牌卡片，默认从 LOPHTY 主视觉开始。纯黑背景上保留用户提供的绿蓝光环原图 `assets/orbit/hero-orbit-light.png`，与标题和轮播同步显现。
- 卡片从示例方形改为现有素材的 **16:9 横向比例**。`cardWidth` 根据桌面舞台宽度取 40%，范围 260～720px，让轮播两侧接近光环边缘；组件同时按可用高度等比缩放。图片使用 `object-fit:contain`，不裁切成方形或拉伸。
- 卡片使用 `curve=0` 保持平面展示，间距为卡宽的 25%，俯视角 `tilt=-14`，透视距离为卡宽的 3 倍。前方卡片大而正面，两侧逐渐侧转，后排缩小并抬高。光环按原图比例缩放并对齐轮播中心。
- `src/hero/CircularCarousel.jsx`：基于官方源码的项目版本。保留空间透视、拖动惯性、键盘导航和作品说明。fly 入场从左侧逐张飞入，先排成正对屏幕的圆环，停留 0.3 秒，再用 1.6 秒连续过渡到 cylinder 位置、角度、缩放和景深；不做整组旋转。`cylinder-entrance.js` 集中管理这段编排，同一批卡片完成整个过程。入场按活动帧计时，暂停时不会跳过。
- 原光环在圆环编排时淡化，进入 cylinder 时同步显现；相对上一版下移 40px，定位在 `hero.css` 的 `.hero-halo`。作品说明在立体轮播显现时出现。
- `node --test tests/cylinder-entrance.test.mjs` 验证单侧错峰飞入、正面圆环和停留阶段、桌面空间边界、各阶段位置/速度连续性，以及与原 cylinder 几何的精确衔接。
- `src/hero/CircularCarousel.css`：官方原始样式；桌面布局、图片填充和作品说明的小幅覆盖集中在 `src/hero/hero.css`。
- 自动巡航为 14 度/秒，鼠标悬停不改速；关闭额外视差和随速度拉伸。可拖动浏览，支持方向键、Home、End。按用户要求隐藏首屏底部的拖动提示、重播入场及暂停/继续控件，保留自动入场、轮播与拖动功能。
- `src/hero/images.js` 与 `dist/assets/orbit/` 保存原始品牌卡片数据与图片。`scripts/build-hero.mjs` 打包到 `dist/hero/orbit.js`、`orbit.css`，不依赖运行时 CDN。

之前的 `OrbitImages.jsx`、`ellipse-rail.js` 和测试作为回退源码保留，当前首屏不使用旧轨道；圆柱入场沿用平滑缓动并独立设置时长。

## 第一屏 SplitText 标题

- `src/hero/SplitText.jsx` 保留官方 JS-CSS registry 原样源码；`SplitText-JS-CSS.json` 和原始组件归档在 `src/vendor/react-bits/`。所需 `gsap@^3.13.0`、`@gsap/react@^2.1.2` 已安装并锁定。
- React Portal 将标题挂载到现有 `h1#hero-title` 内。保留 `Ideas Make Brands POP`、rise、逐字符、50ms 错峰、1.25 秒单字时长、悬停 lift、不循环、不遮罩。结束时发出 `marvlore:title-ready` DOM 事件。
- 标题与轮播共用素材/字体就绪和首次可见条件；轮播实际开始入场时触发标题，避免二次图片解码造成不同步。重播和重新进入首屏时同样同步，标题保持单行居中、固定行高，支持减少动态效果。

已检查桌面视口中的横向比例、完整显示、标题与轮播同步入场，以及暂停/继续、拖动和重播。未新增手机端设计或测试。

## 全屏项目浏览

仅从首屏卡片打开时，`hero-entry.jsx` 额外传入 `titleSource`。顶部 “Ideas Make Brands POP” 与卡片图片共用展开弹簧的位置进度，移动、缩小并交叉切换为左侧项目名称；返回时反向衔接并恢复原始标题。项目标题最终位置、OPPO Sans 字体和字号保持原设置。作品区卡片、项目直达链接不启用此标题过渡。标题临时图层在关闭时清理，原页面的布局与可访问名称保留。

整站可编辑文字统一使用 **OPPO Sans 4.0**。`dist/fonts.css` 优先使用已安装的 OPPO Sans 4.0，否则加载 `dist/assets/fonts/OPPOSans4.0.ttf`；该文件由用户电脑现有字体原样复制，未改字形或裁切。字体来源和官方条款记录在同目录 `FONT-NOTICE.md`。保留完整可变字体以支持后续中英文内容替换；首次没有本机字体的访问会下载完整字体，之后由浏览器缓存。

项目页名称字号在桌面为 `clamp(38px,min(4.8vw,7.5svh),88px)`，行高 1.1、英文跟踪 -0.02em。中文使用英文的 80% 字号、1.3 行高和 0.025em 字距，两行另留 0.16em 空间；标题与图片轨道之间增加 12px 留白。顶部品牌名缩小并放松字距，数字进度也沿用 OPPO Sans。

- `dist/project-gallery.js` / `project-gallery.css`：按照用户提供的「搜索结果页面.jpg」布局，全屏项目图、左侧项目名称、横向图片轨道、顶部返回与关闭、底部项目进度。不显示作者、日期、地点、分类说明或额外正文。中间选中缩略图采用参考图的向下延展展示框；图片以 cover 填充，原始素材与首页卡片比例不变，圆角仍为展示框短边 × 8%。
- 点击首屏的正面或背面卡片，测量当前三维投影的四个角点，用同一张项目图片连续放大至视口。`dist/gallery-geometry.js` 负责矩形到投影四边形的透视变换。关闭时反向收回当前项目的来源卡片；如果来源已不在屏幕上，则淡出返回。
- 横向拖动在按下位置接管弹簧，图片轨道 1:1 跟手，松开结合手势速度吸附。缩略图、左侧名称与整屏背景共享同一个连续位置值，拖动时同步交叉过渡。支持点击缩略图、左右方向键、Home/End。
- `#view/<项目ID>` 可刷新或直接打开。切换项目更新当前 URL，不为每个滑动项目增加历史条目；返回恢复打开之前的位置。首屏在浏览项目时暂停，关闭后保留原位置继续；现有入场、光环与全站圆角规则保留。
- `src/hero/images.js` 为品牌项目名称与素材入口，构建时同步到 `dist/hero/images.js`；作品区使用 `dist/data.js`。未新增依赖。
- `node --test tests/gallery-geometry.test.mjs` 验证左右倾斜卡片的四角投影、展开各中间帧、反向收回几何一致性和循环索引。

### 介绍页独立图片卡片（2026-10-28）
`dist/about-cards.js` 的 `aboutCards` 包含上下两组共 10 张独立卡片。给其中一项的 `image` 填入图片路径即可单独换图；`fit` 控制 cover/contain，`position` 控制取景。为空时通过独立 SVG 视口取用原设计中的参考图案作为临时预览，并非独立原始项目源图。布局、旋转和 8% 圆角均由各自卡片容器控制。介绍页按桌面宽度展开，卡片大小同时受视口高度限制。

介绍区现在采用自然滚动的纵向布局：上卡片弧、介绍文案、下卡片弧通过 flex 和自适应间距依次排列，不再按 100vh 限制。`dist/layout.css` 的 `.about-stage` 中可调整 `--about-card-size`、`--about-card-drop` 和 `gap`，控制卡片大小、弧高和上下分段距离。

### 介绍区滚动叙事（2026-10-28）
`dist/about-experience.js` 联动独立卡片与三组文字：品牌介绍 → 8+ 行业经验 → 60+ 品牌案例；第三组停留后，三组共同展开，上下卡片组同步外移。卡片进场参考 lu78.art 的中心聚拢、逐张旋开与悬停散开/立体倾斜，使用当前素材和 8% 圆角。入场自动完成，不会因停止滚动而卡在半空；文字轮换和最终展开随滚动推进。

`dist/about-motion-model.js` 集中控制阶段、几何和展开间距；`aboutGeometry().runway` 为滚动叙事长度，`aboutMotionFrame()` 的 windows 为三组文字阶段，`.8～.98` 为最终展开。所有联动共用同一进度，滚动反转沿原路径恢复，弹簧保留当前速度。末尾预留真实文档空间，保证下方卡片不覆盖作品区；减少动态效果时恢复自然纵向布局，直接显示全部文字。原介绍区自然滚动样式保留作为无脚本和减少动态效果的布局。

### 当前介绍区：Lu78 Creative AI 原版复刻（2026-10-28）
按用户“先完全复刻，之后再调整”的最新要求，`#about` 现在挂载 `src/about/reference-entry.jsx`。当前视觉使用原站这一段的 10 张卡片、Creative AI SVG、头像、顶部导航和“查看更多”按钮；入场、卡片散开、悬停倾斜及标题互动使用 Motion。按钮和导航连接本网站的首页、作品与联系区。

- 原参考：https://www.lu78.art/
- 单卡素材、原版位置、顺序、角度和散开参数：`src/about/reference-data.js`；素材路径为 `dist/assets/reference-collage/`。
- 样式：`src/about/reference.css`。此复刻组件遵循原版 24px 倒角。
- 构建：`node scripts/build-about.mjs`；生成 `dist/about/reference.js` 和 `reference.css`。
- 上一版三组文案滚动叙事保留在 `AboutStory`、`dist/about-experience.js`、`about-motion-model.js`，当前未挂载。

2026-10-28 后续调整：当前卡片段已移除 Creative AI 标题、查看更多按钮、头像及顶部导航。`src/about/reference.css` 的 `--reference-lead` 将整组卡片下移并保留与服务标签的间隔，分区使用 overflow:clip 防止入场轨迹越过上一屏。入场触发改为 `src/about/entry-visibility.js` 的接近顶部阈值，不再提前一次性播放；完整离开后重新进入会重建动画实例，保留原版聚拢旋开过程。动画完成前暂缓悬停散开，以免覆盖入场动作。

中央介绍文案：`src/about/reference-data.js` 的 `aboutCopy` 配置品牌名称、双语简介、8+ 与 60+ 两组信息，均为独立 OPPO Sans 文字。`src/about/reference.css` 的 `.reference-copy` 控制卡片环中央的宽度、字号及组间距，文案随当前卡片入场一起淡入。

中央文案滚动显现：`src/about/ScrollReveal.jsx` 基于本次取得的官方 JS-CSS 源码适配（原版存于 `src/vendor/react-bits/ScrollReveal.jsx`，与当前 registry 内容一致；GSAP 3.13.0 已安装）。`BrandCopy.jsx` 保留标题、数字、中英文的各自字号，并按 12 行顺序共享滚动区间；使用 fade、0.1 基础透明度、4px 模糊、scrub 和 0° 旋转。`copy-reveal-range.js` 决定自上而下的显现顺序；同一行整体显现，避免英文单词数和中文长度打乱顺序。向上滚动按原路径恢复，减少动态效果时直接显示完整文字。

显现完成位置已提前：文案顶部从视口 88% 处进入，抵达视口 34% 时全部清晰，因此到达用户截图的中央阅读位置（顶部约 30%）时，60+ 及最后一行不会残留模糊；保留逐行顺序和滚动回退效果。

介绍区整体放大 15%：卡片布局尺寸、原有倒角以及中央文字字号、组间距等同比例调整；较窄的桌面窗口限制卡片组宽度以免裁切，上下留白随卡片尺寸计算，滚动显现和单卡素材配置保持可用。

后续介绍区再放大 5%，中央文字沿用 OPPO Sans。服务区修正物理地面比视口底部高约 18px 的问题，让标签视觉底缘落至屏幕底部。

服务区标题的入场和退场统一由 `src/services/title-motion.js` 随滚动控制：未轮到的行完全隐藏，三行按从上到下的顺序显现，避免整段低透明度虚影。退场先将文字整体向上移动，再按各行实际接近屏幕顶部的位置逐行淡出；最后一行移出后才投放标签。字体加载和窗口大小变化会重新测量行位置，向上滚动沿同一过程恢复。

标题入场补充上移轨迹：每行从下方约 22vh（120–240px）移至原排版位置，同时淡入并去模糊；单行滚动过渡加长至进度 0.16，按 0.08 错峰。显示层增加 160ms 平滑衔接，避免鼠标滚轮一步跨过部分滚动进度时跳显，排版测量使用未变换的外层行框。

服务标题离场增加各行独立的向上位移，与逐行去清晰、淡出共用同一进度，依旧在顶部附近开始消失。介绍区 12 行文案也改为零基础透明度、从下方 22vh（120–240px）上移并由模糊变清晰；保留先前的逐行顺序和进入中央阅读区域前全部清晰的完成位置，加入 0.16 秒滚动衔接。

首屏新入场顺序：标题先在视口中央逐词显现并由大缩小；1.35 秒后标题上移到顶部，同时卡片从左侧画面外陆续飞入中央形成堆叠，随后展开为正面圆环并转动 60°，最后平滑变为现有 cylinder 立体轮播，光环随最后的形态过渡显现。`src/hero/cylinder-entrance.js` 共用时间轴驱动标题上移和卡片各阶段；保留最终卡片比例、圆角、拖动、项目展开与匀速旋转。

首屏节奏后续调整：标题整体在中央持续约 2.5 秒从 110% 缓慢缩小到 100%，然后上移。堆叠卡片按顺时针目标位置逐张发出，每张错开 0.16 秒，沿弧线到位；未轮到的卡片留在堆叠中。最后一张到位后直接衔接 cylinder 变形，取消排开后额外的圆环旋转。

按用户 MP4 继续调整：标题缩小幅度减至 4.5%，缩放与逐词显现共用起点；卡片从右侧画面外进入右侧牌堆，前牌先沿顺时针圆弧前行，后牌沿同一路径错峰追随，逐渐拉开角度形成圆环。展开结束后直接衔接现有立体轮播，保留最终画面和光环。

标题缩小幅度后续改为 8%，从文字出现开始持续 2.7 秒，直到上移至顶部的动作结束；缩放和上移共用入场时间轴。

视频后段追随方式调整：整串卡片共用一段圆周展开进度，沿同一顺时针圆弧逐渐拉开角间距；展开终点对齐 cylinder 的正面/背面投影顺序，最后一帧立即开始立体形态过渡，避免停在圆环中间再换位。

作品区逐行显现：`src/work/text-reveal.js` 复用已安装的 GSAP、ScrollTrigger 和 SplitText，作用于 CREATIVE WORK 标题、副标题及四张卡片内的文字。按实际换行拆分，各行从视口 84% 至 62% 的位置由 0.1 透明度/4px 模糊变为清晰，保持水平，随滚动反向恢复。触发点稍后移，过渡距离由视口高度的 14% 延长至 22%，避免刚入屏就立即清晰。图片、卡片尺寸及分类按钮保留；分类重排后刷新触发位置，减少动态效果时直接显示文案。该模块与介绍区共用构建产物，运行时只加载一份 GSAP。


## 作品切片画廊（2026-11-02）

「全部方向」保留原有两列四张分类卡片（含原排版、图片、文案和轻微倾斜悬停）。具体分类页使用独立实现的 Elastic Reel 式图片切片。8 张素材均为站内已有图片；悬停按鼠标距离弹性放大，相邻切片联动，点击以原图比例展开，再点击展开图片或「查看项目」进入现有全屏项目浏览。具体分类按钮显示切片画廊并定位相应方向；「全部方向」和底部「作品」导航返回原四卡片总览。滚轮仍用于正常网页滚动；支持左右方向键、Home / End、Escape 收起及减少动态效果偏好。

- `dist/work-reel-data.js`：逐张修改 `src`、`title`、`subtitle`、`category`、`aspect` 和 `focusX`（0–100，控制窄切片的横向取景）。`aspect` 应等于原图宽÷高。
- 同文件 `workReelOptions`：调整切片宽度、相邻间距、鼠标影响范围和弹簧手感。
- `dist/work-reel.js`：布局、可中断弹簧、鼠标/键盘交互；`dist/work-reel.css`：桌面尺寸和排版。圆角继续使用短边 × 8%，文字继续使用 OPPO Sans。
- 公开交互参考：[React Bits Pro Elastic Reel](https://pro.reactbits.dev/docs/components/elastic-reel)；开源指针距离弹簧参考：[Motion Primitives Dock](https://github.com/ibelick/motion-primitives/blob/main/components/core/dock.tsx)。本站为独立原生 JS 实现，无 Pro 源码、授权密钥或私有注册表依赖。


## 探索区环形卡片景深（2026-11-02）

环形聚拢阶段使用卡片真实深度计算离焦，前排保持清晰，后排渐进虚化；每帧屏幕位移经过卡片投影的局部坐标转换，驱动沿运动方向的快门采样和轻微红青色散。减速后动态拖影收敛，静态后排仍保留景深。减少动态效果时只保留静态景深；进入最终作品墙时平滑退去环形镜头效果。

参数入口为 `dist/explore-optics.js`：`farBlur` 控制远处最大离焦（CSS 像素），`sharpRange` 控制前排清晰范围，`shutter` 控制曝光时长，`maxTravel` 限制拖影距离。`dist/explore-renderer.js` 的片元着色器控制色散比例。卡片轨迹、透视布局、素材、比例和短边 × 8% 圆角沿用原实现。`tests/explore-optics.test.mjs` 验证近远景清晰度、不同帧率曝光一致、旋转表面的运动方向与近侧视角的稳定性。

自然景深修正：环形阶段使用 `dist/explore-gaussian.js` 生成水平、垂直两次滤波的高斯纹理，按方差连续混合模糊级别，并以高斯边缘衰减处理圆角轮廓。替代大半径散点采样，避免重复轮廓；动态拖影和色散收敛为较短、较柔和的反馈。同一素材复用纹理，滤波在加载时完成。参考与实现说明在 `docs/explore-blur-reference.md`。

## 作品独立内页（2026-11-02）

作品区总览卡片和具体分类的切片卡片，均进入独立的纵向项目详情 `#case/<id>`。首屏卡片继续使用原来的 `#view/` 全屏图库。详情页保留返回位置，支持浏览器前进/后退、Escape 关闭、下一项目、阅读进度、图片放大与多图浏览。

- `dist/work-detail-data.js`：详情页数据入口；可在 `workDetailOverrides` 中按项目 id 单独覆盖某个内页。`title` / `subtitle` / `summary` / `intro` / `tags` 维护项目文案；`cover` 为主图；`media` 可继续添加独立图片或视频，未提供素材的部分不显示。图片项格式 `{type:"image",src,alt,width,height}`，视频项格式 `{type:"video",src,poster,alt}`。`nextId` 设置下一项目。当前仅使用站内已有素材和说明，没有编造客户、年份或项目成果。
- `dist/work-detail.js` / `dist/work-detail.css`：内页结构、独立滚动、切换、焦点和历史记录管理；图片圆角使用统一短边 × 8%，字体统一为 OPPO Sans。
- 详情结构参考 [Magic Portfolio 项目页](https://github.com/once-ui-system/magic-portfolio/tree/main/src/app/work)，为 MARVLORE 独立编写布局，不包含其模板源码。图片查看器实际使用 [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) 5.4.4（MIT）；官方 npm 发布文件和许可证位于 `dist/vendor/photoswipe/`，核心仅在打开图片时加载。
