# Phase 8 — 未完成事项与风险

时间：**2026-11-17 09:37 Asia/Shanghai**

## 需产品 / 运维确认后才能做

| 项 | 风险 | 建议 |
|---|---|---|
| 生产 migrate `--execute` | 写坏现网库 | 仅备份副本验证后再执行 |
| 生产发布 CMS/官网 | 服务中断、CORS/缓存误配 | 按 `deploy-rollback.md` 预发冒烟 |
| 删除静态 Work 数据 | 无 CMS 时站点空窗 | 保留静态至 CMS 稳定并监控后再议 |
| `/work/*` 可分享路径 | 破坏现 hash UX / SEO 假设 | 单独立项；先做 302 草案评审 |
| EN 缺译回退 | 英文页空 subtitle/description | 约定：空则隐藏或回退 zh（需产品拍板） |
| 管理读 Token / 关 Public | 若误关 Public，现 Adapter 直连失败 | 先加服务端 BFF 再收权 |

## 技术债 / 残余差距

| 项 | 说明 |
|---|---|
| 全站视觉回归附件 | Phase 8 以 build/test/API 为主；像素级/多断点录屏未附 |
| 上传恶意文件实网拒绝测 | 仅配置层确认 `deniedExecutableTypes` |
| API p95 / 首屏体积 | 无生产环境实测基线 |
| inventory tags 重复行 | 静态盘点 13 行 / unique 12；迁移按 slug 幂等已消化 |
| `.env.example` CORS | 示例偏旧（3000）；运行时默认含 5173/4173——生产仍须显式 `CORS_ORIGIN` |
| 旧 CT（article 等） | 仍在；Public 读保留。清理属另波次 |
| PR 栈 #16→#17→#19 | Phase 8 叠在 Phase 7；合并顺序需自底向上 |

## 冻结面（持续有效）

- 不改 Work DOM/CSS/动效结构谋“适配 CMS”
- 不升级 Strapi 5.52.1 / 不混用包管理器锁文件
- 密钥不进浏览器、不进 Git 文档正文
