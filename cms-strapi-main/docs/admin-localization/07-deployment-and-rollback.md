# 07 — Deployment & rollback (P4)

## Deploy (admin localization)

1. Merge PR to `main` (or release branch).
2. On the CMS host:
   ```bash
   cd cms-strapi-main
   npm ci
   npm run build
   npm run verify:admin-localization
   # restart process manager / container with existing DB — do NOT reinit/seed
   ```
3. Operators: hard-refresh browser (`Ctrl/Cmd+Shift+R`) so admin bundle + `localStorage` language pick up `zh-Hans`.
4. Optional one-time on each environment DB (if labels missing after restore from old backup):
   ```bash
   npm run patch:work-field-labels-cn:execute
   npm run patch:component-field-labels-cn:execute
   ```
   Dry-run first without `:execute`. Never run `reinit:local` / migrate execute / seed execute for this change.

## What ships

| Layer | Mechanism |
|-------|-----------|
| Admin JS bundle | `src/admin/**` translations + ops hubs |
| Schema display metadata | `info.displayName` / component names only |
| CM field labels | core-store metadatas (patch scripts + committed `.tmp/data.db` for local; prod needs patch or CM UI) |

## Rollback

1. Revert the localization merge commit(s) on `main` (or redeploy previous image/tag).
2. Rebuild admin: `npm run build` + restart Strapi.
3. CM labels in DB are additive display metadata — reverting code without re-patching leaves Chinese labels (harmless). To restore English labels, re-run an older patch or edit Content-Type Builder → Configure the view.
4. Do **not** restore production DB solely to undo admin Chinese labels.

## Incidents

| Symptom | Action |
|---------|--------|
| Sidebar still English | Check Profile language = 中文; clear `strapi-admin-language` and reload |
| Field labels English | Run field-label patch scripts on that DB |
| `verify:admin-localization` fails on structure | Stop deploy — structural schema drift; human review required |
| Website broken | Localization PRs must not touch `marvlore-website-main/`; bisect unrelated |
