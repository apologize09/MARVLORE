#!/usr/bin/env node
/**
 * Chinese Content Manager labels for shared components.
 * Dry-run by default. Apply: --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');

const LABELS = {
  'shared.seo': {
    metaTitle: 'SEO 标题',
    metaDescription: 'SEO 描述',
    shareImage: '分享图',
  },
  'shared.about-collage-image': {
    slotIndex: '槽位序号',
    image: '图片',
    imageUrl: '图片 URL（静态回退）',
    alt: '替代文本',
    focus: '焦点',
  },
  'shared.about-stat': {
    number: '数字',
    lines: '说明行',
    sortOrder: '排序',
  },
  'shared.media': {
    file: '文件',
  },
  'shared.quote': {
    title: '标题',
    body: '正文',
  },
  'shared.rich-text': {
    body: '正文',
  },
  'shared.slider': {
    files: '文件列表',
  },
  'shared.social-link': {
    platform: '平台',
    label: '展示文案',
    url: '链接',
    sortOrder: '排序',
  },
  'shared.why-choose-item': {
    titleLine1: '标题行 1',
    titleLine2: '标题行 2',
    title: '标题',
    description: '描述',
    icon: '图标',
  },
};

function applyLabels(cfg, uid) {
  const map = LABELS[uid];
  if (!map) return cfg;
  const next = structuredClone(cfg);
  next.metadatas = next.metadatas || {};
  for (const [field, label] of Object.entries(map)) {
    next.metadatas[field] = next.metadatas[field] || { edit: {}, list: {} };
    next.metadatas[field].edit = {
      ...(next.metadatas[field].edit || {}),
      label,
      visible: next.metadatas[field].edit?.visible !== false,
      editable: next.metadatas[field].edit?.editable !== false,
    };
    next.metadatas[field].list = {
      ...(next.metadatas[field].list || {}),
      label,
      searchable: next.metadatas[field].list?.searchable !== false,
      sortable: next.metadatas[field].list?.sortable !== false,
    };
  }
  return next;
}

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();
  try {
    for (const uid of Object.keys(LABELS)) {
      const key = `plugin_content_manager_configuration_components::${uid}`;
      const row = await app.db.query('strapi::core-store').findOne({ where: { key } });
      if (!row) {
        console.warn('missing', key);
        continue;
      }
      const cfg = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      const next = applyLabels(cfg, uid);
      const sample = Object.keys(LABELS[uid])
        .slice(0, 3)
        .map((f) => `${f}=${next.metadatas?.[f]?.edit?.label}`)
        .join(', ');
      console.log(uid, '→', sample);
      if (EXECUTE) {
        await app.db.query('strapi::core-store').update({
          where: { id: row.id },
          data: { value: JSON.stringify(next) },
        });
      }
    }
    if (!EXECUTE) console.log('dry-run only; pass --execute to apply');
    else console.log('component field labels updated');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
