#!/usr/bin/env node
/**
 * Seed Service Items from src/services/items.js facts.
 * Dry-run by default. Use --execute to write.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const STATIC_SERVICES = [
  {
    legacyId: 'film',
    slug: 'film',
    titleEn: 'Film',
    titleCn: '影视制作',
    imageUrl: './assets/work-film.webp',
    description: '以影像叙事，让品牌的想法被看见。',
    sortOrder: 0,
  },
  {
    legacyId: 'animation',
    slug: 'animation',
    titleEn: 'Animation',
    titleCn: '动画创作',
    imageUrl: './assets/hero-video/swft-icon-poster.webp',
    description: '用节奏与动态，赋予创意鲜活的表达。',
    typeScale: 0.83,
    sortOrder: 1,
  },
  {
    legacyId: 'web',
    slug: 'web',
    titleEn: 'Web Development',
    titleCn: '网站开发',
    imageUrl: './assets/work-web.webp',
    description: '连接品牌、内容与交互，构建数字体验。',
    typeScale: 0.54,
    sortOrder: 2,
  },
  {
    legacyId: 'visual',
    slug: 'visual',
    titleEn: 'Visual Design',
    titleCn: '视觉设计',
    imageUrl: './assets/work-visual/lophthy-visual.webp',
    description: '从品牌语言到视觉系统，形成独特的识别。',
    typeScale: 0.68,
    sortOrder: 3,
  },
  {
    legacyId: 'marvlore',
    slug: 'marvlore',
    titleEn: 'Marvlore',
    titleCn: '迈络文化',
    imageUrl: './assets/work-culture.webp',
    description: '保持好奇，让创作、实验与新想法持续发生。',
    typeScale: 0.9,
    sortOrder: 4,
  },
  {
    legacyId: 'cgi',
    slug: 'cgi',
    titleEn: 'CGI',
    titleCn: '数字影像',
    imageUrl: './assets/orbit/vapx-surface.webp',
    description: '以材质、光影与空间，塑造数字世界的质感。',
    sortOrder: 5,
  },
  {
    legacyId: 'aigc',
    slug: 'aigc',
    titleEn: 'AIGC',
    titleCn: '人工智能创作',
    imageUrl: './assets/work-visual/creative-ip.webp',
    description: '探索新的创作工具，拓展视觉想象的边界。',
    sortOrder: 6,
  },
  {
    legacyId: 'advertising',
    slug: 'advertising',
    titleEn: 'Advertising',
    titleCn: '广告创意',
    imageUrl: './assets/hero-video/pop-palm-poster.webp',
    description: '把品牌主张，转化为有记忆点的创意内容。',
    typeScale: 0.75,
    sortOrder: 7,
  },
  {
    legacyId: '3d-animation',
    slug: '3d-animation',
    titleEn: '3D Animation',
    titleCn: '三维动画',
    imageUrl: './assets/hero-video/flum-pebble-x-poster.webp',
    description: '让产品、角色与空间，在三维世界中生动呈现。',
    typeScale: 0.65,
    sortOrder: 8,
  },
];

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
  const report = { execute: opts.execute, services: [] };

  try {
    for (const item of STATIC_SERVICES) {
      const published = await app.documents('api::service-item.service-item').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: item.legacyId } },
        limit: 1,
        status: 'published',
      });
      const drafts = await app.documents('api::service-item.service-item').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: item.legacyId } },
        limit: 1,
        status: 'draft',
      });
      const hit = published[0] || drafts[0];
      const data = { ...item, isActive: true };

      if (!opts.execute) {
        report.services.push({ action: hit ? 'would-update' : 'would-create', legacyId: item.legacyId });
        continue;
      }

      if (hit?.documentId) {
        await app.documents('api::service-item.service-item').update({
          documentId: hit.documentId,
          locale: opts.locale,
          data,
          status: 'published',
        });
        report.services.push({ action: 'updated', legacyId: item.legacyId, documentId: hit.documentId });
      } else {
        const created = await app.documents('api::service-item.service-item').create({
          locale: opts.locale,
          data,
          status: 'published',
        });
        report.services.push({
          action: 'created',
          legacyId: item.legacyId,
          documentId: created.documentId,
        });
      }
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
