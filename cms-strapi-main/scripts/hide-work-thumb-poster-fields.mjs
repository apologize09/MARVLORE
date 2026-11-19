#!/usr/bin/env node
/**
 * Admin UX: keep only 封面 on work-project edit form.
 * Hides thumbnail / poster (+ URL fallbacks) from Content Manager edit layout.
 * Schema columns stay for legacy DB rows; site/DTO now resolve those slots from cover.
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

const HIDE = new Set(['thumbnail', 'thumbnailUrl', 'poster', 'posterUrl']);

function patch(cfg) {
  const next = structuredClone(cfg);
  next.metadatas = next.metadatas || {};

  for (const name of HIDE) {
    const prev = next.metadatas[name] || { edit: {}, list: {} };
    next.metadatas[name] = {
      ...prev,
      edit: {
        ...(prev.edit || {}),
        visible: false,
        editable: false,
        description: '已停用：前台统一使用封面。',
      },
      list: {
        ...(prev.list || {}),
        searchable: false,
        sortable: false,
      },
    };
  }

  if (next.metadatas.cover?.edit) {
    next.metadatas.cover.edit.description =
      '作品主图：列表缩略、详情封面、视频海报均使用此图。';
  }

  const edit = next.layouts?.edit || [];
  next.layouts = next.layouts || {};
  next.layouts.edit = edit
    .map((row) => (Array.isArray(row) ? row.filter((cell) => cell?.name && !HIDE.has(cell.name)) : row))
    .filter((row) => Array.isArray(row) && row.length > 0);

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
    const next = patch(cfg);
    console.log('edit before', flatten(cfg.layouts?.edit).filter((n) => HIDE.has(n) || n === 'cover'));
    console.log('edit after', flatten(next.layouts?.edit).filter((n) => HIDE.has(n) || n === 'cover' || n === 'coverUrl'));
    for (const name of HIDE) {
      console.log(name, 'visible=', next.metadatas[name]?.edit?.visible);
    }
    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply');
      return;
    }
    db.prepare('update strapi_core_store_settings set value=? where id=?').run(
      JSON.stringify(next),
      row.id,
    );
    console.log('thumbnail/poster hidden from work-project edit layout');
  } finally {
    db.close();
  }
}

main();
