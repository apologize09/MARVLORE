#!/usr/bin/env node
/**
 * Promote work-category nameCn + eyebrow in Content Manager edit layout
 * (near the top, with Chinese labels) so they are visible in admin.
 *
 * Dry-run by default. Apply with: node scripts/patch-work-category-cm-layout.mjs --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const KEY = 'plugin_content_manager_configuration_content_types::api::work-category.work-category';

function patchConfig(cfg) {
  const next = structuredClone(cfg);

  next.metadatas = next.metadatas || {};
  next.metadatas.nameCn = {
    edit: {
      label: '中文名',
      description: '官网分类卡片旁的中文名称（如：影视动画）',
      placeholder: '影视动画',
      visible: true,
      editable: true,
    },
    list: { label: '中文名', searchable: true, sortable: true },
  };
  next.metadatas.eyebrow = {
    edit: {
      label: '眉题',
      description: '官网分类卡片顶部小标题（如：Creative Visuals）',
      placeholder: 'Creative Visuals',
      visible: true,
      editable: true,
    },
    list: { label: '眉题', searchable: true, sortable: true },
  };
  if (next.metadatas.name?.edit) {
    next.metadatas.name.edit.label = '英文名';
  }

  // Rebuild edit layout: name / nameCn / eyebrow / slug first
  const edit = next.layouts?.edit || [];
  const flat = edit.flat().filter((cell) => cell && cell.name);
  const byName = new Map(flat.map((cell) => [cell.name, cell]));
  const take = (name, size) => {
    const cell = byName.get(name) || { name, size };
    byName.delete(name);
    return { name: cell.name, size: size ?? cell.size ?? 6 };
  };

  const rebuilt = [
    [take('name', 6), take('nameCn', 6)],
    [take('eyebrow', 6), take('slug', 6)],
    [take('description', 6), take('level', 4)],
  ];

  // Keep remaining rows in original relative order, skipping already placed fields
  const placed = new Set(['name', 'nameCn', 'eyebrow', 'slug', 'description', 'level']);
  for (const row of edit) {
    const kept = row.filter((cell) => cell?.name && !placed.has(cell.name));
    if (kept.length) rebuilt.push(kept.map((c) => ({ name: c.name, size: c.size })));
  }

  // Append any leftover attributes still in byName
  const leftovers = [...byName.values()].filter((c) => !placed.has(c.name));
  if (leftovers.length) {
    for (let i = 0; i < leftovers.length; i += 2) {
      rebuilt.push(leftovers.slice(i, i + 2).map((c) => ({ name: c.name, size: c.size || 6 })));
    }
  }

  next.layouts = next.layouts || {};
  next.layouts.edit = rebuilt;

  // Show Chinese name in list view
  const list = next.layouts.list || [];
  if (!list.includes('nameCn')) {
    const idx = list.indexOf('name');
    if (idx >= 0) list.splice(idx + 1, 0, 'nameCn');
    else list.push('nameCn');
  }
  next.layouts.list = list;

  return next;
}

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    const store = app.store({ type: 'plugin', name: 'content_manager', key: 'configuration_content_types' });
    // Strapi stores one key per UID via core store; use db query for exact key
    const row = await app.db.query('strapi::core-store').findOne({ where: { key: KEY } });
    if (!row) throw new Error(`Missing core store key: ${KEY}`);
    const cfg = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    const next = patchConfig(cfg);

    console.log('edit layout before:', JSON.stringify(cfg.layouts.edit.slice(0, 2)));
    console.log('edit layout after:', JSON.stringify(next.layouts.edit.slice(0, 3)));
    console.log('nameCn label:', next.metadatas.nameCn.edit.label);
    console.log('eyebrow label:', next.metadatas.eyebrow.edit.label);

    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply');
      return;
    }

    await app.db.query('strapi::core-store').update({
      where: { id: row.id },
      data: { value: JSON.stringify(next) },
    });
    console.log('Content Manager layout updated');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
