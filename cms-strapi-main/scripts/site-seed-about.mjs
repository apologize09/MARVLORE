#!/usr/bin/env node
/**
 * Seed About Page from src/about/reference-data.js facts.
 * Only copy + collage src/alt/focus — no geometry. Dry-run by default.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const ARTWORKS = [
  {
    slotIndex: 0,
    imageUrl: './assets/reference-collage/project-04.webp',
    alt: '绿色星形角色 · 白色品牌创意场景',
    focus: '53% 50%',
  },
  {
    slotIndex: 1,
    imageUrl: './assets/about-white/lophthy-visual.webp',
    alt: 'LOPHTY · 白底人物视觉',
    focus: '0% 50%',
  },
  {
    slotIndex: 2,
    imageUrl: './assets/about-white/daily-mark.webp',
    alt: 'DAILY · 白底品牌标识',
    focus: '50% 50%',
  },
  {
    slotIndex: 3,
    imageUrl: './assets/about-white/summo-character.webp',
    alt: 'SUMMO · 白底角色设计',
    focus: '50% 50%',
  },
  {
    slotIndex: 4,
    imageUrl: './assets/orbit/vapes-dog.webp',
    alt: 'Vapes Bars · 白色宠物品牌场景',
    focus: '100% 50%',
  },
  {
    slotIndex: 5,
    imageUrl: './assets/home-projects/lophthy-01.webp',
    alt: 'LOPHTY · 蓝色品牌视觉提案',
    focus: '40% 50%',
  },
  {
    slotIndex: 6,
    imageUrl: './assets/work-visual/lophthy-graphic-blue.webp',
    alt: 'LOPHTY · 蓝色视觉图形',
    focus: '50% 50%',
  },
  {
    slotIndex: 7,
    imageUrl: './assets/reference-collage/project-02.webp',
    alt: '安慕希整颗蓝莓酸奶 · 蓝色创意场景',
    focus: '0% 50%',
  },
  {
    slotIndex: 8,
    imageUrl: './assets/work-covers/film-blue-152.webp',
    alt: 'POP Palm · 蓝色产品动画视觉',
    focus: '50% 50%',
  },
  {
    slotIndex: 9,
    imageUrl: './assets/work-covers/culture-lophty-152.webp',
    alt: 'LOPHTY · 蓝色品牌空间视觉',
    focus: '80% 50%',
  },
];

const ABOUT = {
  brandName: 'Marvlore',
  brandNameCn: '（迈络）',
  partnerLine: 'Your Full-Service Partner for Brand Visuals & Creative Content',
  partnerLineCn: '您的品牌视觉与内容创意全案伙伴',
  stats: [
    {
      number: '8',
      lines: ['Industries Served', '八大行业服务经验', 'FMCG, Beauty, 3C, Electronics...', '快消，美妆，3C 等'],
      sortOrder: 0,
    },
    {
      number: '60',
      lines: ['Brand Cases', 'Pop-worthy visuals for 60+ brands', '赋能 60+ 品牌打造出圈视觉'],
      sortOrder: 1,
    },
  ],
  collageImages: ARTWORKS,
  seo: {
    metaTitle: 'Marvlore 迈络',
    metaDescription: 'Your Full-Service Partner for Brand Visuals & Creative Content',
  },
};

function parseArgs(argv) {
  const opts = { execute: false, database: null, locale: 'zh-CN' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--execute') opts.execute = true;
    else if (a === '--database' && argv[i + 1]) opts.database = argv[++i];
    else if (a === '--locale' && argv[i + 1]) opts.locale = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.database) process.env.DATABASE_FILENAME = opts.database;

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: path.join(root, 'dist') }).load();
  const report = { execute: opts.execute, about: null };

  try {
    const published = await app.documents('api::about-page.about-page').findFirst({
      locale: opts.locale,
      status: 'published',
    });
    const draft = await app.documents('api::about-page.about-page').findFirst({
      locale: opts.locale,
      status: 'draft',
    });
    const hit = published || draft;

    if (!opts.execute) {
      report.about = {
        action: hit ? 'would-update' : 'would-create',
        collage: ARTWORKS.length,
        stats: ABOUT.stats.length,
      };
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    if (hit?.documentId) {
      await app.documents('api::about-page.about-page').update({
        documentId: hit.documentId,
        locale: opts.locale,
        data: ABOUT,
        status: 'published',
      });
      report.about = { action: 'updated', documentId: hit.documentId };
    } else {
      const created = await app.documents('api::about-page.about-page').create({
        locale: opts.locale,
        data: ABOUT,
        status: 'published',
      });
      report.about = { action: 'created', documentId: created.documentId };
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
