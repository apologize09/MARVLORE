# Phase 8 — 备份恢复演练结果

时间：**2026-11-17 09:37 Asia/Shanghai**  
范围：本地开发库（**非生产**）。

## 演练步骤

1. 复制 SQLite：
   ```bash
   mkdir -p /tmp/p8-backup-drill
   cp cms-strapi-main/.tmp/data.db /tmp/p8-backup-drill/data.db
   ```
2. 校验哈希一致：
   ```bash
   sha256sum cms-strapi-main/.tmp/data.db /tmp/p8-backup-drill/data.db
   ```
   结果：`91bf8b0b1347891d04624f4f1d541c8171c144a260cd815512c9113a0ac48a36`（两端相同）。
3. 恢复到临时文件并查询：
   ```bash
   cp /tmp/p8-backup-drill/data.db /tmp/p8-backup-drill/restored.db
   # sha256 与源库一致；zh-CN published projects documentId 计数 = 19
   ```
4. uploads 目录存在性：`cms-strapi-main/public/uploads` 存在，本机文件数约 **183**（含历史非 Work 上传）。

## 结论

| 项 | 结果 |
|---|---|
| DB 文件级备份 | 通过 |
| 哈希校验 | 通过 |
| 恢复后可读 Work 计数 | 通过（19 projects） |
| uploads 与 DB 同备份周期 | **流程建议已写**；本演练未打包 tarball |
| 生产恢复 | **未执行** |

## 建议生产流程（待确认后执行）

1. 停写或短维护窗。
2. 同时快照 `DATABASE_FILENAME` 与 `public/uploads`（及任何对象存储挂载）。
3. 校验 sha256 / 清单。
4. 在**隔离环境**恢复并 `npm run start` + `verify:i18n` + 抽样 Public API。
5. 保留最近 7 日 / 4 周 / 3 月（容量确认后固化）。
