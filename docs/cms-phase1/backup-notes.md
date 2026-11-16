# Backup notes (Wave B)

Local-only backups (gitignored under `cms-strapi-main/.backups/`):

| Artifact | Path | Check |
|---|---|---|
| SQLite | `cms-strapi-main/.backups/phase1-20261116/data.db` | sha256 matches pre-schema `.tmp/data.db` |
| Uploads tarball | `cms-strapi-main/.backups/phase1-20261116/uploads.tgz` | `tar -tzf` lists files |
| Pre-schema DB copy | `cms-strapi-main/.tmp/data.db.pre-work-models.bak` | same sha256 |

Restore smoke (already run):

```bash
cp .backups/phase1-20261116/data.db /tmp/restore-test.db
sha256sum .tmp/data.db .backups/phase1-20261116/data.db /tmp/restore-test.db
```

Do not commit `.backups/` or `*.bak`. Tracked live DB remains `.tmp/data.db` until a deliberate migration commit.
