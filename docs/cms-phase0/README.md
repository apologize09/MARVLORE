# CMS Phase 0 产出

本目录为 **只读审计** 结果，对应合并实施路径「波次 A0 / V1.1 Phase 0」。

| 文件 | 内容 |
|---|---|
| `implementation-audit.md` | 源码事实、Work 盘点、URL/History、CMS 错位、冻结契约 |
| `work-static-inventory.json` | 可机读静态内容与素材存在性 |
| `url-inventory.csv` | 现有 hash/history 与 V1.1 建议路径对照 |
| `migration-risks.md` | 风险分级与待确认决策 |

**本阶段未修改** `marvlore-website-main` / `cms-strapi-main` 业务代码。

## 已确认决策

- Locale：`zh-CN` + `en`
- Work URL：继续 hash（`#case/{id}`）
- 视频：先引用静态 `dist/assets/hero-video/*`

## 下一阶段

波次 B / Phase 1 产出见 [`docs/cms-phase1/`](../cms-phase1/README.md)（`work-*` schema + 验证记录）。  
Phase 2 产出见 [`docs/cms-phase2/`](../cms-phase2/README.md)（校验规则 + Public 只读）。  
Phase 3 产出见 [`docs/cms-phase3/`](../cms-phase3/README.md)（Work Public API / DTO / 搜索）。  
Phase 4 产出见 [`docs/cms-phase4/`](../cms-phase4/README.md)（静态数据迁移工具；默认 dry-run）。  
Phase 5–7 见 [`cms-phase5`](../cms-phase5/README.md) / [`cms-phase6`](../cms-phase6/README.md) / [`cms-phase7`](../cms-phase7/README.md)。  
Phase 8 交接见 [`docs/cms-phase8/`](../cms-phase8/README.md)。
