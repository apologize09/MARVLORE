# CMS V1.0 Phase 0 — 差距审计与安全基线

时间：**2026-11-17 09:41 Asia/Shanghai**  
对照包：`/tmp/marvlore-cms-pack/MARVLORE-CMS-V1`  
前提：V1.1 Work 路径 Phase 0–8 已落地（`work-*` / Adapter / i18n / 交接文档）。

## 结论

| 范围 | 状态 |
|---|---|
| V1.0 **Work**（Project Category / Project / Media） | **由 V1.1 `work-*` 覆盖**；不再平行新建 `project*` |
| V1.0 i18n `zh-CN`+`en` | **已完成**（V1.1 Phase 7） |
| V1.0 其余区块 | **未落地**（见下表） |
| 旧 CT 删除 | `quote-request` 等已在 Phase 2 清理；Contact 现为 mailto 静态页，**无表单 POST** |

## V1.0 模型 ↔ 仓库

| V1.0 模型 | 动作 |
|---|---|
| Project Category / Project / Project Media | **跳过** → 使用 `work-category` / `work-project` / `work-project-media` |
| Global Setting | **本波次新增** `global-setting`（Contact 文案/联络） |
| Award | **本波次新增** `award` |
| Service Category / Service Item | 后续 |
| About Page + collage | 后续（仅换图文，几何冻结） |
| Hero Item | 后续 |
| Explore Item / Portal Card | 后续 |
| Home Page | 后续（Award 暂不绑 home-page 关系） |
| Inquiry | 后续（受控 POST；现网无表单） |

## 回补顺序（冻结 DOM/动效）

1. Contact（Global Setting）→ Awards  
2. Services → About（仅 copy/media）  
3. Hero → Explore → Portal  
4. Inquiry（限流 + honeypot）  
5. Publish webhook / hardening（V1.0 Phase 6–7）

## 备份（本机，gitignored）

```
cms-strapi-main/.backups/v1-phase0-20261117/data.db
cms-strapi-main/.backups/v1-phase0-20261117/uploads.tgz
```

sha256(data.db)：见同目录演练记录；**未**将备份或 `.env` 值提交 Git。

## 基线命令（承接 Phase 8）

- 官网：`pnpm check` / `pnpm test` / `pnpm build`
- CMS：`npm run verify:i18n` / `npm run build`

## 风险（V1.0 特有）

- Pack schema 含 `home_page` 等未建类型的关系 → **本波次裁掉**，避免启动失败  
- 与现有 `api::global` / `api::about` 并存；新类型用 `global-setting` / 日后 `about-page`，**不覆盖旧 CT**  
- Portal 60 卡、大视频 uploads：仍按 V1.1 风险表延后  
- 未经确认：**不**生产 migrate / 不删静态源
