#!/usr/bin/env node
/**
 * Link Strapi Media Library files onto CMS media relations using *Url string fields.
 * Dry-run by default. Use --execute to write.
 *
 * Matches file.caption (set by sync-site-media to `/assets/...`) against content URLs.
 * Does not invent paths — only links when a URL field is present and a file exists.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const LOCALES = ['zh-CN', 'en'];

/** @type {Array<{ uid: string; pairs: Array<{ urlField: string; mediaField: string }>; single?: boolean; componentField?: string }>} */
const LINK_TARGETS = [
  {
    uid: 'api::work-project.work-project',
    pairs: [
      { urlField: 'coverUrl', mediaField: 'cover' },
      { urlField: 'thumbnailUrl', mediaField: 'thumbnail' },
      { urlField: 'heroMediaUrl', mediaField: 'heroMedia' },
      { urlField: 'videoUrl', mediaField: 'video' },
      { urlField: 'posterUrl', mediaField: 'poster' },
      { urlField: 'previewVideoUrl', mediaField: 'previewVideo' },
      { urlField: 'homePreviewVideoUrl', mediaField: 'homePreviewVideo' },
    ],
  },
  {
    uid: 'api::work-project-media.work-project-media',
    pairs: [
      { urlField: 'imageUrl', mediaField: 'image' },
      { urlField: 'videoUrl', mediaField: 'video' },
      { urlField: 'posterUrl', mediaField: 'poster' },
    ],
  },
  {
    uid: 'api::work-category.work-category',
    pairs: [{ urlField: 'coverUrl', mediaField: 'cover' }],
  },
  {
    uid: 'api::hero-item.hero-item',
    pairs: [
      { urlField: 'imageUrl', mediaField: 'image' },
      { urlField: 'videoUrl', mediaField: 'video' },
      { urlField: 'videoUrlHd', mediaField: 'videoHd' },
      { urlField: 'previewUrl', mediaField: 'preview' },
      { urlField: 'homePreviewUrl', mediaField: 'homePreview' },
    ],
  },
  {
    uid: 'api::award.award',
    pairs: [{ urlField: 'imageUrl', mediaField: 'image' }],
  },
  {
    uid: 'api::service-item.service-item',
    pairs: [{ urlField: 'imageUrl', mediaField: 'image' }],
  },
  {
    uid: 'api::about-page.about-page',
    single: true,
    componentField: 'collageImages',
    pairs: [{ urlField: 'imageUrl', mediaField: 'image' }],
  },
];

function parseArgs(argv) {
  const opts = { execute: false, database: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq === -1 ? a : a.slice(0, eq);
    const inline = eq === -1 ? null : a.slice(eq + 1);
    if (key === '--execute') opts.execute = true;
    else if (key === '--database') opts.database = inline != null ? inline : argv[++i];
  }
  return opts;
}

/** Normalize CMS URL strings to `/assets/...` captions used by sync-site-media. */
export function normalizeSitePath(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      s = u.pathname;
    } catch {
      return null;
    }
  }
  s = s.split('?')[0].split('#')[0];
  s = s.replace(/^\.\//, '');
  if (s.startsWith('assets/')) s = `/${s}`;
  if (!s.startsWith('/') && !s.startsWith('uploads/')) s = `/assets/${s}`;
  // Already /uploads/... — not a site asset caption
  if (s.startsWith('/uploads/')) return null;
  return s;
}

function mediaId(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  if (typeof value === 'object') {
    if (value.id != null) return Number(value.id);
    if (Array.isArray(value) && value[0]) return mediaId(value[0]);
  }
  return null;
}

async function buildCaptionIndex(app) {
  const files = await app.db.query('plugin::upload.file').findMany({
    select: ['id', 'name', 'url', 'caption', 'mime'],
    limit: 5000,
  });
  /** @type {Map<string, { id: number, url: string, name: string }>} */
  const byCaption = new Map();
  for (const f of files || []) {
    const key = normalizeSitePath(f.caption);
    if (!key) continue;
    byCaption.set(key, { id: f.id, url: f.url, name: f.name });
    // also index without leading slash variants already normalized
  }
  return byCaption;
}

async function linkEntity(app, { uid, doc, locale, pairs, byCaption, execute }) {
  const data = {};
  const planned = [];
  const missing = [];

  for (const { urlField, mediaField } of pairs) {
    const rawUrl = doc[urlField];
    const sitePath = normalizeSitePath(rawUrl);
    if (!sitePath) continue;

    const file = byCaption.get(sitePath);
    if (!file) {
      missing.push({ urlField, mediaField, sitePath });
      continue;
    }

    const currentId = mediaId(doc[mediaField]);
    if (currentId === file.id) {
      planned.push({ action: 'already-linked', mediaField, fileId: file.id, sitePath });
      continue;
    }

    data[mediaField] = file.id;
    planned.push({
      action: currentId ? 'would-relink' : 'would-link',
      mediaField,
      fileId: file.id,
      previousId: currentId,
      sitePath,
      libraryUrl: file.url,
    });
  }

  if (!Object.keys(data).length) {
    return { planned, missing, action: planned.length ? 'noop' : missing.length ? 'missing-files' : 'no-urls' };
  }

  if (!execute) {
    return { planned, missing, action: 'dry-run' };
  }

  await app.documents(uid).update({
    documentId: doc.documentId,
    locale,
    data,
    status: 'published',
  });

  return {
    planned: planned.map((p) => ({ ...p, action: p.action.replace('would-', '') })),
    missing,
    action: 'updated',
  };
}

/**
 * Link media inside a repeatable component collection (e.g. About collageImages).
 * Updates each component row via db.query — Document Service component replace
 * rejects re-sent ids across locales ("not related to the entity").
 */
async function linkComponentCollection(app, { uid, doc, locale, componentField, pairs, byCaption, execute }) {
  const items = Array.isArray(doc[componentField]) ? doc[componentField] : [];
  const planned = [];
  const missing = [];
  const updates = [];

  // Component UID mirrors schema: shared.about-collage-image
  const componentUid =
    componentField === 'collageImages' ? 'shared.about-collage-image' : null;
  if (!componentUid) {
    return {
      planned: [],
      missing: [{ error: `Unsupported componentField ${componentField}` }],
      action: 'error',
    };
  }

  for (const item of items) {
    if (item?.id == null) continue;
    const data = {};

    for (const { urlField, mediaField } of pairs) {
      const rawUrl = item[urlField];
      const sitePath = normalizeSitePath(rawUrl);
      if (!sitePath) continue;

      const file = byCaption.get(sitePath);
      if (!file) {
        missing.push({
          urlField,
          mediaField,
          sitePath,
          slotIndex: item.slotIndex,
        });
        continue;
      }

      const currentId = mediaId(item[mediaField]);
      if (currentId === file.id) {
        planned.push({
          action: 'already-linked',
          mediaField,
          fileId: file.id,
          sitePath,
          slotIndex: item.slotIndex,
        });
        continue;
      }

      data[mediaField] = file.id;
      planned.push({
        action: currentId ? 'would-relink' : 'would-link',
        mediaField,
        fileId: file.id,
        previousId: currentId,
        sitePath,
        libraryUrl: file.url,
        slotIndex: item.slotIndex,
        componentId: item.id,
      });
    }

    if (Object.keys(data).length) {
      updates.push({ id: item.id, data });
    }
  }

  if (!updates.length) {
    return {
      planned,
      missing,
      action: planned.length ? 'noop' : missing.length ? 'missing-files' : 'no-urls',
    };
  }

  if (!execute) {
    return { planned, missing, action: 'dry-run' };
  }

  for (const { id, data } of updates) {
    await app.db.query(componentUid).update({
      where: { id },
      data,
    });
  }

  return {
    planned: planned.map((p) => ({ ...p, action: p.action.replace('would-', '') })),
    missing,
    action: 'updated',
  };
}

function recordResult(report, target, doc, locale, result) {
  for (const p of result.planned) {
    if (p.action === 'already-linked') report.already += 1;
    else if (p.action.startsWith('would-') || p.action === 'link' || p.action === 'relink') {
      report.linked += 1;
      report.byUid[target.uid].linkedFields += 1;
    }
  }
  report.missing += result.missing.length;
  report.byUid[target.uid].missingFields += result.missing.length;

  if (result.action === 'updated' || result.action === 'dry-run') {
    if (result.action === 'updated') {
      report.updatedDocs += 1;
      report.byUid[target.uid].updated += 1;
    }
    if (report.samples.length < 12 && result.planned.some((p) => p.action !== 'already-linked')) {
      report.samples.push({
        uid: target.uid,
        locale,
        documentId: doc.documentId,
        title: doc.title || doc.name || doc.slug || doc.brandName || null,
        ...result,
      });
    }
  }
}

async function loadDocs(app, target, locale) {
  const mediaPopulate = target.componentField
    ? {
        [target.componentField]: {
          populate: Object.fromEntries(target.pairs.map((p) => [p.mediaField, true])),
        },
      }
    : Object.fromEntries(target.pairs.map((p) => [p.mediaField, true]));

  if (target.single) {
    const row = await app.documents(target.uid).findFirst({
      locale,
      status: 'published',
      populate: mediaPopulate,
    });
    return row ? [row] : [];
  }

  return (
    (await app.documents(target.uid).findMany({
      locale,
      status: 'published',
      limit: 500,
      populate: mediaPopulate,
    })) || []
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.database) process.env.DATABASE_FILENAME = opts.database;

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: path.join(cmsRoot, 'dist') }).load();

  const report = {
    execute: opts.execute,
    linked: 0,
    already: 0,
    missing: 0,
    updatedDocs: 0,
    byUid: {},
    samples: [],
  };

  try {
    const byCaption = await buildCaptionIndex(app);
    report.libraryIndexed = byCaption.size;

    for (const target of LINK_TARGETS) {
      report.byUid[target.uid] = { docs: 0, linkedFields: 0, missingFields: 0, updated: 0 };

      for (const locale of LOCALES) {
        const docs = await loadDocs(app, target, locale);

        for (const doc of docs) {
          report.byUid[target.uid].docs += 1;
          let result;
          try {
            result = target.componentField
              ? await linkComponentCollection(app, {
                  uid: target.uid,
                  doc,
                  locale,
                  componentField: target.componentField,
                  pairs: target.pairs,
                  byCaption,
                  execute: opts.execute,
                })
              : await linkEntity(app, {
                  uid: target.uid,
                  doc,
                  locale,
                  pairs: target.pairs,
                  byCaption,
                  execute: opts.execute,
                });
          } catch (err) {
            result = {
              planned: [],
              missing: [{ error: err.message || String(err) }],
              action: 'error',
            };
            report.samples.push({
              uid: target.uid,
              locale,
              documentId: doc.documentId,
              error: err.message || String(err),
            });
          }

          recordResult(report, target, doc, locale, result);
        }
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
