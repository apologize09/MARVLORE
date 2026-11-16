# CMS Phase 0 — 迁移与实施风险清单

## P0 / 高

| 风险 | 说明 | 缓解 |
|---|---|---|
| 误改路由破坏 Work UX | 现网依赖 `#work` / `#case/{id}` / history state，无 `/work` 路径 | Phase 0 后仍保持 hash；可分享 URL 单独立项 |
| 未验证 schema 写入现库 | V1.0 JSON / V1.1 逻辑模型都未在 5.52.1 实测 | 仅在备份副本/空白库验证通过后再合入 |
| 删除或覆盖旧 CMS 类型 | 现有 12 类型仍有 Public 权限与可能数据 | 采用 V1.1：**只增不删** |
| 编造业务字段 | 客户名、年份、成果、翻译在静态源中常缺失 | dry-run；缺字段留空；人工确认后 `--execute` |
| 前端视觉回归 | Adapter 若改 DOM/动效参数会破坏品牌站 | 冻结契约；只换 ViewModel 数据源 |

## P1 / 中

| 风险 | 说明 | 缓解 |
|---|---|---|
| i18n 插件缺失 | package.json 无 `@strapi/plugin-i18n` | 先提兼容版本安装计划，批准后再装 |
| locale code 分歧 | V1.0 用 `zh-CN`，V1.1 写 `zh` | Phase A2 一次定死并写入契约 |
| Portal 60 卡对账 | wall 由循环+overrides 生成，非 60 独立源文件 | 迁移前导出每卡最终 image/alt/keepOriginal |
| 大视频进 uploads | hero mp4 体积大；本地存储备份压力 | 可先 URL 引用静态 `dist/assets`，上传另批 |
| film 数量动态 | `filmProjects` 随 `heroProjects.videoSrc` 变 | 迁移脚本读模块，不写死条数 |
| 双轨数据漂移 | CMS 与静态 JS 长期并存 | feature flag 分区块；对账报告；禁止静默覆盖 |
| SQLite 单写 | 生产多实例不安全 | V1 保持单实例+持久盘；PG 另立项 |
| Inquiry/表单 | quote-request 与 V1.0 Inquiry 并存切换 | Work 完成后再换；补限流 |

## P2 / 低

| 风险 | 说明 | 缓解 |
|---|---|---|
| SEO/sitemap | 现站基本无独立作品 path | 引入可分享 URL 后再做 |
| 搜索性能 | SQLite LIKE 可撑现规模 | 记录 p95；不够再评估 |
| 缓存头与媒体 URL | 文件名不变时 CDN 易脏读 | 结合已有 hash/CDN batch；发布清缓存 |
| 包管理混用 | 官网 pnpm、CMS npm | 各用各的锁文件，不混装 |

## 决策已确认（2026-11-16）

1. **Locale**：**`zh-CN` + `en`**（不用 `zh`）  
2. **Work 详情 URL**：**继续 hash**（`#case/{id}` / `#work`）；暂不做 `/work/...` 路径  
3. **视频策略**：**先引用静态路径** `dist/assets/hero-video/*`；CMS 存元数据/URL，不大文件上传  

## 仍待确认（非阻塞 Phase 1 建模）

4. **旧 CMS 内容**：本地 reinit / SQLite 数据是否需保留到生产？  
5. 备份演练通过后再合入 schema。  


## 回滚原则

- 文档阶段：删除分支即可。  
- 模型阶段：恢复 DB 备份；关闭 feature flag。  
- 迁移阶段：未批准不 `--execute`；执行后用备份库回滚。  
- 前端：flag 关闭即回静态数据，无需回滚构建产物逻辑。
