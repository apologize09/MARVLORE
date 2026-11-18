#!/usr/bin/env node
/**
 * Backfill work-category nameCn + eyebrow from the live website overview cards.
 * Does not change site markup — only fills CMS so admin matches current display.
 *
 * Dry-run by default. Apply with: node scripts/align-work-category-cn.mjs --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const CAT = 'api::work-category.work-category';

/** Exact copy from marvlore-website-main/dist/data.js overview cards */
const L2_COPY = {
  film: {
    name: 'Film & Animation',
    nameCn: '影视动画',
    eyebrow: 'Creative Visuals',
    description: 'AI 时代下技术赋能与视觉表达的融合实践探索',
  },
  visual: {
    name: 'Visual Design',
    nameCn: '视觉设计',
    eyebrow: 'Brand Visuals',
    description: '极简形态下的试验语言与多元视觉的研究',
  },
  web: {
    name: 'Web Development',
    nameCn: '网站设计',
    eyebrow: 'Digital Experiences',
    description: '以品牌为起点，连接内容、界面与交互体验',
  },
  culture: {
    name: 'Marvlore',
    nameCn: '迈络文化',
    eyebrow: 'Marvlore Culture',
    description: '迈络的创作、实验与持续发生的新想法',
  },
};

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    for (const locale of ['zh-CN', 'en']) {
      const rows = await app.documents(CAT).findMany({
        locale,
        status: 'draft',
        filters: { level: { $eq: 2 } },
        limit: 50,
      });
      console.log(`[${locale}] draft L2 count=${rows.length}`);

      for (const row of rows) {
        const key = row.slug;
        const patch = L2_COPY[key];
        if (!patch) {
          console.log(`  skip ${key} (no site copy map)`);
          continue;
        }
        const data = {
          name: patch.name,
          nameCn: patch.nameCn,
          eyebrow: patch.eyebrow,
          description: patch.description,
        };
        const changed =
          row.name !== data.name ||
          row.nameCn !== data.nameCn ||
          row.eyebrow !== data.eyebrow ||
          (row.description || null) !== data.description;
        console.log(`  ${key}`, {
          from: {
            name: row.name,
            nameCn: row.nameCn,
            eyebrow: row.eyebrow,
            description: row.description,
          },
          to: data,
          changed,
        });
        if (!EXECUTE || !changed) continue;

        await app.documents(CAT).update({
          documentId: row.documentId,
          locale,
          data,
        });
        await app.documents(CAT).publish({
          documentId: row.documentId,
          locale,
        });
        console.log(`  ${key} updated+published`);
      }
    }
    console.log(EXECUTE ? 'done (executed)' : 'dry-run only; pass --execute to apply');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
