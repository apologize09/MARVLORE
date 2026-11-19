#!/usr/bin/env node
/**
 * Backfill nameCn for the root Work category (slug=work).
 * Empty nameCn makes CM relation pickers show documentId instead of a label.
 *
 * Dry-run by default. Apply: --execute
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const NAME_CN = '作品';

function main() {
  process.chdir(CMS_ROOT);
  const Database = require('better-sqlite3');
  const dbPath = path.join(CMS_ROOT, '.tmp/data.db');
  if (!fs.existsSync(dbPath)) {
    console.error('missing', dbPath);
    process.exit(1);
  }
  const db = new Database(dbPath);
  try {
    const rows = db
      .prepare(
        `select id, document_id, locale, name, name_cn, slug, level
         from work_categories
         where slug = 'work' and level = 1`,
      )
      .all();
    console.log(
      'candidates',
      rows.map((r) => ({ id: r.id, locale: r.locale, name: r.name, name_cn: r.name_cn })),
    );
    const empty = rows.filter((r) => !r.name_cn);
    if (!EXECUTE) {
      console.log('would update', empty.length, '→', NAME_CN);
      console.log('dry-run only; pass --execute to apply');
      return;
    }
    const result = db
      .prepare(
        `update work_categories
         set name_cn = ?
         where slug = 'work' and level = 1 and (name_cn is null or name_cn = '')`,
      )
      .run(NAME_CN);
    console.log('updated', result.changes);
  } finally {
    db.close();
  }
}

main();
