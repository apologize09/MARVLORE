#!/usr/bin/env node
/**
 * Replace hex-encoded work-tag slugs with readable English slugs
 * derived from the Chinese display names.
 *
 * Also fixes en locale `name` when it was wrongly set to the hex slug.
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

/** Map by current slug OR zh-CN name → { slug, enName } */
const BY_SLUG = {
  't-e5889be6848fe8a7': { slug: 'creative-character-visual', enName: 'Creative Character Visual' },
  't-e59381e7898ce4b8': { slug: 'brand-key-visual', enName: 'Brand Key Visual' },
  't-e59381e7898ce7ad': { slug: 'brand-planning-visual', enName: 'Brand Planning & Visual' },
  't-e59381e7898ce8a7': { slug: 'brand-visual', enName: 'Brand Visual' },
  't-e5bdb1e8a786e58a': { slug: 'film-animation', enName: 'Film & Animation' },
  't-e7bd91e7ab99e8ae': { slug: 'web', enName: 'Web Design' }, // already web on zh; keep
  't-e8a786e8a789e59b': { slug: 'visual-graphics', enName: 'Visual Graphics' },
  't-e8a786e8a789e8ae': { slug: 'visual-design', enName: 'Visual Design' },
  't-e8a786e9a2912026': { slug: 'video-advertising', enName: 'Video & Advertising' },
  't-e8bf88e7bb9ce696': { slug: 'marvlore-culture', enName: 'Marvlore Culture' },
};

const BY_ZH_NAME = {
  创意角色视觉: BY_SLUG['t-e5889be6848fe8a7'],
  品牌主视觉: BY_SLUG['t-e59381e7898ce4b8'],
  品牌策划与视觉: BY_SLUG['t-e59381e7898ce7ad'],
  品牌视觉: BY_SLUG['t-e59381e7898ce8a7'],
  影视动画: BY_SLUG['t-e5bdb1e8a786e58a'],
  网站设计: { slug: 'web', enName: 'Web Design' },
  视觉图形: BY_SLUG['t-e8a786e8a789e59b'],
  视觉设计: BY_SLUG['t-e8a786e8a789e8ae'],
  '视频 & 广告': BY_SLUG['t-e8a786e9a2912026'],
  迈络文化: BY_SLUG['t-e8bf88e7bb9ce696'],
};

function resolveTarget(row) {
  if (BY_SLUG[row.slug]) return BY_SLUG[row.slug];
  if (BY_ZH_NAME[row.name]) return BY_ZH_NAME[row.name];
  return null;
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
    const rows = db.prepare('select id, document_id, name, slug, locale from work_tags').all();
    const updates = [];
    for (const row of rows) {
      const target = resolveTarget(row);
      if (!target) continue;
      const nextSlug = target.slug;
      const nextName =
        row.locale === 'en' && (row.name === row.slug || /^t-[0-9a-f]+$/i.test(row.name))
          ? target.enName
          : row.name;
      if (nextSlug === row.slug && nextName === row.name) continue;
      updates.push({ id: row.id, from: row, nextSlug, nextName });
    }

    console.log(
      'planned',
      updates.map((u) => ({
        id: u.id,
        locale: u.from.locale,
        name: `${u.from.name} → ${u.nextName}`,
        slug: `${u.from.slug} → ${u.nextSlug}`,
      })),
    );

    // uniqueness check within locale
    const after = new Map();
    for (const row of rows) {
      const planned = updates.find((u) => u.id === row.id);
      const slug = planned ? planned.nextSlug : row.slug;
      const key = `${row.locale}::${slug}`;
      if (after.has(key) && after.get(key) !== row.document_id) {
        throw new Error(`slug collision: ${key}`);
      }
      after.set(key, row.document_id);
    }

    if (!EXECUTE) {
      console.log('dry-run only; pass --execute to apply', updates.length, 'rows');
      return;
    }

    const stmt = db.prepare('update work_tags set slug = ?, name = ? where id = ?');
    const tx = db.transaction((list) => {
      for (const u of list) stmt.run(u.nextSlug, u.nextName, u.id);
    });
    tx(updates);
    console.log('updated', updates.length, 'work_tags rows');
  } finally {
    db.close();
  }
}

main();
