#!/usr/bin/env node
/**
 * Seed Global Setting + Awards from static website facts.
 * Dry-run by default. Use --execute to write. Never invent missing copy.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const STATIC_AWARDS = [
  {
    legacyId: 'award-aigc',
    imageUrl: 'award-aigc.webp',
    alt: '全球 AIGC 艾菲奖，GLOBAL AIGC EFFIE AWARD',
    name: 'GLOBAL AIGC EFFIE AWARD',
    sortOrder: 0,
  },
  {
    legacyId: 'award-reddot',
    imageUrl: 'award-reddot.webp',
    alt: '设计红点奖，RED DOT AWARD',
    name: 'RED DOT AWARD',
    sortOrder: 1,
  },
  {
    legacyId: 'award-partner',
    imageUrl: 'award-partner.webp',
    alt: '新片场官方合作伙伴，OFFICIAL PARTNER OF NEW STUDIOS MEDIA',
    name: 'OFFICIAL PARTNER OF NEW STUDIOS MEDIA',
    sortOrder: 2,
  },
];

const STATIC_CONTACT = {
  siteName: 'MARVLORE',
  siteNameCn: '迈络',
  tagline: 'Ideas Make Brands POP',
  email: 'contact@marvlore.com',
  phone: '+8619832866221',
  phoneDisplay: '198 3286 6221',
  wechat: 'marvloreM',
  addressEn: 'Shenzhen,\nChina',
  addressCn: '中国深圳',
  studioNoteEn: 'Brand Visuals & Creative Content',
  studioNoteCn: '品牌视觉与创意内容',
  welcomeCn: '欢迎联络',
  copyrightText: 'MARVLORE 迈络',
  defaultSeo: {
    metaTitle: 'MARVLORE 迈络',
    metaDescription: 'Brand Visuals & Creative Content',
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
  if (opts.database) {
    process.env.DATABASE_FILENAME = opts.database;
  }

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: path.join(root, 'dist') }).load();

  const report = { execute: opts.execute, contact: null, awards: [] };

  try {
    if (opts.execute) {
      const existing = await app.documents('api::global-setting.global-setting').findFirst({});
      if (existing?.documentId) {
        await app.documents('api::global-setting.global-setting').update({
          documentId: existing.documentId,
          data: STATIC_CONTACT,
        });
        report.contact = { action: 'updated', documentId: existing.documentId };
      } else {
        const created = await app.documents('api::global-setting.global-setting').create({
          data: STATIC_CONTACT,
        });
        report.contact = { action: 'created', documentId: created.documentId };
      }
    } else {
      report.contact = { action: 'dry-run', data: STATIC_CONTACT };
    }

    for (const award of STATIC_AWARDS) {
      const found = await app.documents('api::award.award').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: award.legacyId } },
        limit: 1,
        status: 'draft',
      });
      const published = await app.documents('api::award.award').findMany({
        locale: opts.locale,
        filters: { legacyId: { $eq: award.legacyId } },
        limit: 1,
        status: 'published',
      });
      const hit = published[0] || found[0];

      if (!opts.execute) {
        report.awards.push({ action: hit ? 'would-update' : 'would-create', legacyId: award.legacyId });
        continue;
      }

      const data = {
        ...award,
        isActive: true,
      };

      if (hit?.documentId) {
        await app.documents('api::award.award').update({
          documentId: hit.documentId,
          locale: opts.locale,
          data,
          status: 'published',
        });
        report.awards.push({ action: 'updated', legacyId: award.legacyId, documentId: hit.documentId });
      } else {
        const created = await app.documents('api::award.award').create({
          locale: opts.locale,
          data,
          status: 'published',
        });
        report.awards.push({
          action: 'created',
          legacyId: award.legacyId,
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
