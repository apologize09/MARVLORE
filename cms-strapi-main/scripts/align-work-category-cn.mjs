#!/usr/bin/env node
/**
 * Backfill work-category fields from the live website overview cards
 * (name / nameCn / eyebrow / description / coverUrl). Does not change site markup.
 *
 * Dry-run by default. Apply with: node scripts/align-work-category-cn.mjs --execute
 * After execute, run: npm run link:site-media:execute  (to refresh Media Library cover)
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');
const CAT = 'api::work-category.work-category';

/**
 * Exact homepage overview card copy + images from marvlore-website-main/dist/data.js
 * (film/culture use overviewImage; visual/web use image)
 */
const L2_COPY = {
  film: {
    name: 'Film & Animation',
    nameCn: '影视动画',
    eyebrow: 'Creative Visuals',
    description: 'AI 时代下技术赋能与视觉表达的融合实践探索',
    coverUrl: '/assets/work-covers/film-blue-152.webp',
  },
  visual: {
    name: 'Visual Design',
    nameCn: '视觉设计',
    eyebrow: 'Brand Visuals',
    description: '极简形态下的试验语言与多元视觉的研究',
    coverUrl: '/assets/work-visual/lophthy-visual.webp',
  },
  web: {
    name: 'Web Development',
    nameCn: '网站设计',
    eyebrow: 'Digital Experiences',
    description: '以品牌为起点，连接内容、界面与交互体验',
    coverUrl: '/assets/work-web.webp',
  },
  culture: {
    name: 'Marvlore',
    nameCn: '迈络文化',
    eyebrow: 'Marvlore Culture',
    description: '迈络的创作、实验与持续发生的新想法',
    coverUrl: '/assets/work-covers/culture-lophty-152.webp',
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
        const patch = L2_COPY[row.slug];
        if (!patch) {
          console.log(`  skip ${row.slug}`);
          continue;
        }
        const data = {
          name: patch.name,
          nameCn: patch.nameCn,
          eyebrow: patch.eyebrow,
          description: patch.description,
          coverUrl: patch.coverUrl,
        };
        const changed =
          row.name !== data.name ||
          row.nameCn !== data.nameCn ||
          row.eyebrow !== data.eyebrow ||
          (row.description || null) !== data.description ||
          (row.coverUrl || null) !== data.coverUrl;
        console.log(`  ${row.slug}`, {
          from: {
            nameCn: row.nameCn,
            eyebrow: row.eyebrow,
            coverUrl: row.coverUrl,
          },
          to: { nameCn: data.nameCn, eyebrow: data.eyebrow, coverUrl: data.coverUrl },
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
        console.log(`  ${row.slug} updated+published`);
      }
    }
    console.log(EXECUTE ? 'done (executed)' : 'dry-run only; pass --execute to apply');
    if (EXECUTE) {
      console.log('Next: npm run link:site-media:execute  # refresh Media Library cover from coverUrl');
    }
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
