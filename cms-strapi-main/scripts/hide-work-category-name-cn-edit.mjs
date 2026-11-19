#!/usr/bin/env node
/**
 * Hide categoryNameCn from work-project edit form (auto-synced; ops use 所属分类).
 * Keep it on the list view for Chinese category filtering.
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
const FIELD = 'categoryNameCn';

function patch(cfg) {
  const next = structuredClone(cfg);
  next.metadatas = next.metadatas || {};
  const prev = next.metadatas[FIELD] || { edit: {}, list: {} };
  next.metadatas[FIELD] = {
    ...prev,
    edit: {
      ...(prev.edit || {}),
      label: prev.edit?.label || '所属分类中文名',
      description: '由所属分类自动同步，列表筛选用；编辑页不展示。',
      visible: false,
      editable: false,
    },
    list: {
      ...(prev.list || {}),
      label: prev.list?.label || '所属分类',
      searchable: true,
      sortable: true,
    },
  };

  const edit = next.layouts?.edit || [];
  next.layouts = next.layouts || {};
  next.layouts.edit = edit
    .map((row) =>
      Array.isArray(row) ? row.filter((cell) => cell?.name && cell.name !== FIELD) : row,
    )
    .filter((row) => Array.isArray(row) && row.length > 0);

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
    const before = (cfg.layouts?.edit || []).flat().some((c) => c?.name === FIELD);
    const after = (next.layouts?.edit || []).flat().some((c) => c?.name === FIELD);
    console.log({
      inEditBefore: before,
      inEditAfter: after,
      editVisible: next.metadatas[FIELD]?.edit?.visible,
      list: next.layouts?.list,
    });
    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply');
      return;
    }
    db.prepare('update strapi_core_store_settings set value=? where id=?').run(
      JSON.stringify(next),
      row.id,
    );
    console.log('categoryNameCn hidden from edit; kept on list');
  } finally {
    db.close();
  }
}

main();
