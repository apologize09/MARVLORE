#!/usr/bin/env node
/**
 * Seed Hero Items from src/hero/images.js facts (URL strings only).
 * Dry-run by default.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const ORBIT = [
  ['vapx-surface', 'VapX 品牌视觉', 4001, 2251],
  ['vapx-screen', 'VapX 数字展示', 4001, 2250],
  ['vapes-bars', 'Vapes Bars 品牌视觉', 4002, 2251],
  ['vapx-direction', 'VapX 视觉叙事', 4002, 2251],
  ['vapes-space', 'Vapes Bars 空间视觉', 4001, 2250],
  ['lophthy-apparel', 'LOPHTY 品牌应用', 4001, 2250],
  ['lophthy-pop', 'LOPHTY 品牌主视觉', 4001, 2251],
  ['vapes-dog', 'Vapes Bars 品牌周边', 4002, 2250],
].map(([id, alt, width, height], sortOrder) => ({
  legacyId: `orbit-${id}`,
  slug: `orbit-${id}`,
  role: 'orbit',
  mediaType: 'image',
  title: alt,
  alt,
  imageUrl: `./assets/orbit/${id}.webp`,
  width,
  height,
  sortOrder,
  isActive: true,
}));

const VIDEO_PROJECTS = [
  ['swft-icon', 'SWFT ICON'],
  ['pop-palm', 'POP Palm'],
  ['puff', 'PUFF'],
  ['flum-mi', 'FLUM MI'],
  ['flum-pebble-x', 'Flum Pebble X'],
].map(([slug, title], sortOrder) => ({
  legacyId: `hero-video-${slug}`,
  slug,
  role: 'project',
  mediaType: 'video',
  title,
  alt: `${title} 品牌影片`,
  imageUrl: `./assets/hero-video/${slug}-poster.webp`,
  videoUrl: `./assets/hero-video/${slug}.mp4`,
  videoUrlHd: `./assets/hero-video/${slug}-1080p.mp4`,
  previewUrl: `./assets/hero-video/${slug}-preview.mp4`,
  homePreviewUrl: `./assets/hero-video/${slug}-home-360p.mp4`,
  width: 1280,
  height: 720,
  sortOrder,
  isActive: true,
}));

const IMAGE_PROJECTS = [
  ['lophthy', 'LOPHTY 品牌视觉'],
  ['vapes-bars', 'Vapes Bars 品牌视觉'],
  ['vapx', 'VapX 品牌视觉'],
].map(([slug, title], i) => ({
  legacyId: `hero-image-${slug}`,
  slug,
  role: 'project',
  mediaType: 'image',
  title,
  alt: title,
  imageUrl: `./assets/home-projects/${slug}-cover.webp`,
  slides: Array.from(
    { length: 5 },
    (_, index) => `./assets/home-projects/${slug}-${String(index + 1).padStart(2, '0')}.webp`,
  ),
  width: 2400,
  height: 1350,
  sortOrder: VIDEO_PROJECTS.length + i,
  isActive: true,
}));

const ITEMS = [...ORBIT, ...VIDEO_PROJECTS, ...IMAGE_PROJECTS];

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
  const report = { execute: opts.execute, items: [] };

  try {
    for (const item of ITEMS) {
      const published = await app.documents('api::hero-item.hero-item').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: item.legacyId } },
        limit: 1,
        status: 'published',
      });
      const drafts = await app.documents('api::hero-item.hero-item').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: item.legacyId } },
        limit: 1,
        status: 'draft',
      });
      const hit = published[0] || drafts[0];

      if (!opts.execute) {
        report.items.push({ action: hit ? 'would-update' : 'would-create', legacyId: item.legacyId });
        continue;
      }

      if (hit?.documentId) {
        await app.documents('api::hero-item.hero-item').update({
          documentId: hit.documentId,
          locale: opts.locale,
          data: item,
          status: 'published',
        });
        report.items.push({ action: 'updated', legacyId: item.legacyId, documentId: hit.documentId });
      } else {
        const created = await app.documents('api::hero-item.hero-item').create({
          locale: opts.locale,
          data: item,
          status: 'published',
        });
        report.items.push({
          action: 'created',
          legacyId: item.legacyId,
          documentId: created.documentId,
        });
      }
    }
    console.log(JSON.stringify({ ...report, counts: { total: ITEMS.length, orbit: ORBIT.length, projects: VIDEO_PROJECTS.length + IMAGE_PROJECTS.length } }, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
