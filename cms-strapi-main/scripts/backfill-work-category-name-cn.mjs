#!/usr/bin/env node
/**
 * Backfill work-project.categoryNameCn from related work-category.nameCn.
 * Dry-run by default. Apply with: node scripts/backfill-work-category-name-cn.mjs --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const PROJECT = 'api::work-project.work-project';

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    const locales = ['zh-CN', 'en'];
    let updated = 0;
    let skipped = 0;

    for (const locale of locales) {
      const rows = await app.documents(PROJECT).findMany({
        locale,
        status: 'draft',
        fields: ['documentId', 'title', 'categoryNameCn'],
        populate: { category: { fields: ['documentId', 'name', 'nameCn', 'level'] } },
        limit: 500,
      });

      for (const row of rows) {
        const cat = row.category;
        const label =
          (typeof cat?.nameCn === 'string' && cat.nameCn.trim()) ||
          (typeof cat?.name === 'string' && cat.name.trim()) ||
          null;
        if (!label) {
          skipped += 1;
          console.log(`[skip] ${locale} ${row.title} — no category`);
          continue;
        }
        if (row.categoryNameCn === label) {
          skipped += 1;
          continue;
        }
        console.log(`[set] ${locale} ${row.title}: ${row.categoryNameCn || '(empty)'} → ${label}`);
        if (EXECUTE) {
          await app.documents(PROJECT).update({
            documentId: row.documentId,
            locale,
            data: { categoryNameCn: label },
          });
          // Keep published entries in sync when a published version exists
          try {
            await app.documents(PROJECT).publish({ documentId: row.documentId, locale });
          } catch {
            // draft-only is fine
          }
        }
        updated += 1;
      }
    }

    console.log({ updated, skipped, execute: EXECUTE });
    if (!EXECUTE) console.log('dry-run only; pass --execute to apply');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
