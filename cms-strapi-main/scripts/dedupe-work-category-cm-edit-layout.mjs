#!/usr/bin/env node
/**
 * Remove duplicate fields from work-category Content Manager edit layout.
 * Same class of bug as work-project: parent…seo appended twice.
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
const KEY =
  'plugin_content_manager_configuration_content_types::api::work-category.work-category';

function dedupeEditLayout(edit) {
  const seen = new Set();
  const next = [];
  for (const row of edit || []) {
    if (!Array.isArray(row)) continue;
    const cells = [];
    for (const cell of row) {
      const name = cell?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      cells.push(cell);
    }
    if (cells.length) next.push(cells);
  }
  return next;
}

function flatten(edit) {
  return (edit || []).flat().map((c) => c?.name).filter(Boolean);
}

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
    const row = db.prepare('select id, value from strapi_core_store_settings where key=?').get(KEY);
    if (!row) throw new Error(`missing ${KEY}`);
    const cfg = JSON.parse(row.value);
    const before = flatten(cfg.layouts?.edit);
    const deduped = dedupeEditLayout(cfg.layouts?.edit);
    const after = flatten(deduped);
    const dups = [...new Set(before.filter((n, i) => before.indexOf(n) !== i))];
    console.log('before', before.length, 'after', after.length, 'removed', dups.join(',') || '(none)');
    console.log('order', after.join(' → '));
    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply');
      return;
    }
    cfg.layouts = { ...(cfg.layouts || {}), edit: deduped };
    db.prepare('update strapi_core_store_settings set value=? where id=?').run(
      JSON.stringify(cfg),
      row.id,
    );
    console.log('work-category edit layout deduped');
  } finally {
    db.close();
  }
}

main();
