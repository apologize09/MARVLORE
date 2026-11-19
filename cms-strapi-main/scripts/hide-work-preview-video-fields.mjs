#!/usr/bin/env node
/**
 * Admin UX: keep only 首页预览视频 on work-project (drop 预览视频).
 * Hides previewVideo / previewVideoUrl from Content Manager edit layout.
 * Schema columns stay; site/DTO resolve legacy preview slots from home preview.
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

const HIDE = new Set(['previewVideo', 'previewVideoUrl']);

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
        description: '已停用：前台统一使用首页预览视频。',
      },
      list: {
        ...(prev.list || {}),
        searchable: false,
        sortable: false,
      },
    };
  }

  if (next.metadatas.homePreviewVideo?.edit) {
    next.metadatas.homePreviewVideo.edit.description =
      '首页圆柱卡片循环预览（轻量）；悬停/列表预览也使用此视频。';
  }
  if (next.metadatas.homePreviewVideoUrl?.edit) {
    next.metadatas.homePreviewVideoUrl.edit.description =
      '可选；无媒体库文件时的静态资源回退路径。';
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
    console.log(
      'edit before',
      flatten(cfg.layouts?.edit).filter((n) => HIDE.has(n) || n.startsWith('homePreview')),
    );
    console.log(
      'edit after',
      flatten(next.layouts?.edit).filter((n) => HIDE.has(n) || n.startsWith('homePreview')),
    );
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
    console.log('previewVideo hidden; homePreviewVideo kept');
  } finally {
    db.close();
  }
}

main();
