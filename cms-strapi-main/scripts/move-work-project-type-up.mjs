#!/usr/bin/env node
/**
 * Move required projectType near the top of work-project edit layout
 * (after title/slug) so ops don't miss it below media fields.
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
  'plugin_content_manager_configuration_content_types::api::work-project.work-project';

function flatten(edit) {
  return (edit || []).flat().map((c) => c?.name).filter(Boolean);
}

function patch(cfg) {
  const next = structuredClone(cfg);
  const edit = next.layouts?.edit || [];
  const byName = new Map();
  for (const row of edit) {
    for (const cell of row || []) {
      if (cell?.name) byName.set(cell.name, { name: cell.name, size: cell.size || 6 });
    }
  }

  const take = (name, size) => {
    const cell = byName.get(name) || { name, size: size ?? 6 };
    byName.delete(name);
    return { name: cell.name, size: size ?? cell.size ?? 6 };
  };

  // Priority header: identity + required type + category
  const rebuilt = [
    [take('title', 6), take('slug', 6)],
    [take('projectType', 6), take('category', 6)],
    [take('subtitle', 6), take('eyebrow', 6)],
  ];
  const placed = new Set(['title', 'slug', 'projectType', 'category', 'subtitle', 'eyebrow']);

  for (const row of edit) {
    const kept = (row || []).filter((cell) => cell?.name && !placed.has(cell.name));
    if (kept.length) {
      rebuilt.push(kept.map((c) => ({ name: c.name, size: c.size || 6 })));
      for (const c of kept) byName.delete(c.name);
    }
  }

  const leftovers = [...byName.values()];
  for (let i = 0; i < leftovers.length; i += 2) {
    rebuilt.push(leftovers.slice(i, i + 2).map((c) => ({ name: c.name, size: c.size || 6 })));
  }

  next.layouts = next.layouts || {};
  next.layouts.edit = rebuilt;
  return next;
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
    const next = patch(cfg);
    console.log('before top', flatten(cfg.layouts?.edit).slice(0, 8).join(' → '));
    console.log('after top', flatten(next.layouts?.edit).slice(0, 8).join(' → '));
    console.log('projectType index', flatten(next.layouts?.edit).indexOf('projectType'));
    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply');
      return;
    }
    db.prepare('update strapi_core_store_settings set value=? where id=?').run(
      JSON.stringify(next),
      row.id,
    );
    console.log('projectType moved up in edit layout');
  } finally {
    db.close();
  }
}

main();
