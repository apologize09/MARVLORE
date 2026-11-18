#!/usr/bin/env node
/**
 * Work list: show 所属分类 (categoryNameCn) instead of relying on AVAILABLE IN.
 * Also label category relation with Chinese mainField (nameCn).
 *
 * Dry-run by default. Apply with: node scripts/patch-work-project-cm-layout.mjs --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const PROJECT_KEY =
  'plugin_content_manager_configuration_content_types::api::work-project.work-project';
const CATEGORY_KEY =
  'plugin_content_manager_configuration_content_types::api::work-category.work-category';

function patchProject(cfg) {
  const next = structuredClone(cfg);
  next.metadatas = next.metadatas || {};

  next.metadatas.categoryNameCn = {
    edit: {
      label: '所属分类中文名',
      description: '由所属分类自动同步，列表筛选用。一般无需手改。',
      placeholder: '影视动画',
      visible: true,
      editable: false,
    },
    list: { label: '所属分类', searchable: true, sortable: true },
  };

  next.metadatas.category = next.metadatas.category || { edit: {}, list: {} };
  next.metadatas.category.edit = {
    ...(next.metadatas.category.edit || {}),
    label: '所属分类',
    description: '官网作品方向（二级分类）',
    visible: true,
    editable: true,
    mainField: 'nameCn',
  };
  next.metadatas.category.list = {
    label: '所属分类',
    searchable: true,
    sortable: true,
  };

  if (next.metadatas.subtitle?.list) {
    next.metadatas.subtitle.list.label = '副标题';
  }
  if (next.metadatas.title?.list) {
    next.metadatas.title.list.label = '标题';
  }

  // List: id / title / slug / subtitle / 所属分类 — Available In is i18n-injected; admin CSS hides it.
  const preferred = ['id', 'title', 'slug', 'subtitle', 'categoryNameCn'];
  const prev = Array.isArray(next.layouts?.list) ? next.layouts.list : [];
  const rest = prev.filter((name) => !preferred.includes(name) && name !== 'category');
  next.layouts = next.layouts || {};
  next.layouts.list = [...preferred, ...rest];

  // Keep category near the top of the edit form
  const edit = next.layouts.edit || [];
  const flat = edit.flat().filter((cell) => cell && cell.name);
  const byName = new Map(flat.map((cell) => [cell.name, cell]));
  const take = (name, size) => {
    const cell = byName.get(name) || { name, size };
    byName.delete(name);
    return { name: cell.name, size: size ?? cell.size ?? 6 };
  };

  const rebuilt = [
    [take('title', 6), take('slug', 6)],
    [take('subtitle', 6), take('category', 6)],
    [take('categoryNameCn', 6), take('eyebrow', 6)],
  ];
  const placed = new Set(['title', 'slug', 'subtitle', 'category', 'categoryNameCn', 'eyebrow']);
  for (const row of edit) {
    const kept = row.filter((cell) => cell?.name && !placed.has(cell.name));
    if (kept.length) rebuilt.push(kept.map((c) => ({ name: c.name, size: c.size })));
  }
  const leftovers = [...byName.values()].filter((c) => !placed.has(c.name));
  for (let i = 0; i < leftovers.length; i += 2) {
    rebuilt.push(leftovers.slice(i, i + 2).map((c) => ({ name: c.name, size: c.size || 6 })));
  }
  next.layouts.edit = rebuilt;

  return next;
}

function patchCategory(cfg) {
  const next = structuredClone(cfg);
  next.settings = next.settings || {};
  next.settings.mainField = 'nameCn';
  next.metadatas = next.metadatas || {};
  if (next.metadatas.nameCn?.edit) {
    next.metadatas.nameCn.edit.label = '中文名';
  }
  return next;
}

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    for (const [key, patch] of [
      [PROJECT_KEY, patchProject],
      [CATEGORY_KEY, patchCategory],
    ]) {
      const row = await app.db.query('strapi::core-store').findOne({ where: { key } });
      if (!row) throw new Error(`Missing core store key: ${key}`);
      const cfg = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      const next = patch(cfg);
      console.log(key);
      console.log('  list before:', cfg.layouts?.list);
      console.log('  list after:', next.layouts?.list);
      console.log('  mainField:', next.settings?.mainField);
      if (EXECUTE) {
        await app.db.query('strapi::core-store').update({
          where: { id: row.id },
          data: { value: JSON.stringify(next) },
        });
      }
    }
    if (!EXECUTE) console.log('dry-run only; pass --execute to apply');
    else console.log('Content Manager layouts updated');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
