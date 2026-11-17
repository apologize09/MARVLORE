#!/usr/bin/env node
/**
 * Sync Marvlore website static assets into Strapi Media Library.
 * Source of truth: marvlore-website-main/dist/assets (existing files only).
 * Dry-run by default. Use --execute to upload.
 *
 * Does NOT invent copy or rewrite CMS content URL fields — only fills
 * plugin::upload.file (+ optional Media Library folders).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(cmsRoot, '..');
const require = createRequire(import.meta.url);

const DEFAULT_ASSETS = path.join(repoRoot, 'marvlore-website-main', 'dist', 'assets');
const MEDIA_EXTS = new Set([
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.avif',
  '.mp4',
  '.webm',
  '.mov',
]);
const SKIP_DIR_NAMES = new Set(['fonts']);

const MIME_BY_EXT = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function parseArgs(argv) {
  const opts = {
    execute: false,
    database: null,
    assetsDir: DEFAULT_ASSETS,
    imagesOnly: false,
    videosOnly: false,
    limit: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq === -1 ? a : a.slice(0, eq);
    const inline = eq === -1 ? null : a.slice(eq + 1);
    const next = () => (inline != null ? inline : argv[++i]);

    if (key === '--execute') opts.execute = true;
    else if (key === '--database') opts.database = next();
    else if (key === '--assets') opts.assetsDir = path.resolve(next());
    else if (key === '--images-only') opts.imagesOnly = true;
    else if (key === '--videos-only') opts.videosOnly = true;
    else if (key === '--limit') opts.limit = Number.parseInt(String(next()), 10);
  }
  return opts;
}

function walkMediaFiles(rootDir, { imagesOnly, videosOnly }) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        walk(abs);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!MEDIA_EXTS.has(ext)) continue;
      const isVideo = ext === '.mp4' || ext === '.webm' || ext === '.mov';
      if (imagesOnly && isVideo) continue;
      if (videosOnly && !isVideo) continue;
      const rel = path.relative(rootDir, abs).split(path.sep).join('/');
      out.push({ abs, rel, ext, isVideo, size: fs.statSync(abs).size });
    }
  };
  walk(rootDir);
  out.sort((a, b) => a.rel.localeCompare(b.rel));
  return out;
}

function sitePathFor(rel) {
  return `/assets/${rel}`;
}

function displayNameFor(rel) {
  // Keep folder context so Media Library names stay unique & searchable
  return rel.replace(/\//g, '__');
}

function folderKeyFor(rel) {
  const parts = rel.split('/');
  if (parts.length === 1) return 'root';
  return parts[0];
}

function sha1File(filePath) {
  const hash = createHash('sha1');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

async function ensureFolder(app, name, parentId = null, cache) {
  const cacheKey = `${parentId || 'root'}::${name}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const where = parentId
    ? { name: { $eq: name }, parent: { id: parentId } }
    : { name: { $eq: name }, parent: { id: { $null: true } } };

  let folder = await app.db.query('plugin::upload.folder').findOne({ where });
  if (!folder) {
    folder = await app.plugin('upload').service('folder').create({
      name,
      parent: parentId,
    });
  }
  cache.set(cacheKey, folder);
  return folder;
}

async function findExisting(app, file) {
  const name = displayNameFor(file.rel);
  const byName = await app.db.query('plugin::upload.file').findOne({
    where: { name: { $eq: name } },
  });
  if (byName) return { file: byName, reason: 'name' };

  const byCaption = await app.db.query('plugin::upload.file').findOne({
    where: { caption: { $eq: sitePathFor(file.rel) } },
  });
  if (byCaption) return { file: byCaption, reason: 'caption' };

  return null;
}

async function uploadOne(app, file, folderId) {
  const name = displayNameFor(file.rel);
  const mimetype = MIME_BY_EXT[file.ext] || 'application/octet-stream';
  const uploaded = await app.plugin('upload').service('upload').upload({
    data: {
      fileInfo: {
        name,
        alternativeText: file.rel,
        caption: sitePathFor(file.rel),
        folder: folderId,
      },
    },
    files: {
      filepath: file.abs,
      originalFileName: path.basename(file.rel),
      size: file.size,
      mimetype,
    },
  });
  return Array.isArray(uploaded) ? uploaded[0] : uploaded;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.database) process.env.DATABASE_FILENAME = opts.database;

  const inventory = walkMediaFiles(opts.assetsDir, opts);
  const limited = opts.limit ? inventory.slice(0, opts.limit) : inventory;

  const report = {
    execute: opts.execute,
    assetsDir: opts.assetsDir,
    totals: {
      inventory: inventory.length,
      images: inventory.filter((f) => !f.isVideo).length,
      videos: inventory.filter((f) => f.isVideo).length,
      bytes: inventory.reduce((n, f) => n + f.size, 0),
      processing: limited.length,
    },
    folders: {},
    uploaded: 0,
    skipped: 0,
    failed: 0,
    items: [],
  };

  if (!opts.execute) {
    for (const file of limited) {
      report.items.push({
        action: 'would-upload',
        rel: file.rel,
        sitePath: sitePathFor(file.rel),
        folder: `marvlore-site/${folderKeyFor(file.rel)}`,
        bytes: file.size,
        sha1: sha1File(file.abs).slice(0, 12),
      });
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: path.join(cmsRoot, 'dist') }).load();

  try {
    const folderCache = new Map();
    const rootFolder = await ensureFolder(app, 'marvlore-site', null, folderCache);

    for (const file of limited) {
      const key = folderKeyFor(file.rel);
      report.folders[key] = (report.folders[key] || 0) + 1;

      try {
        const existing = await findExisting(app, file);
        if (existing) {
          report.skipped += 1;
          report.items.push({
            action: 'skipped-existing',
            rel: file.rel,
            reason: existing.reason,
            id: existing.file.id,
            url: existing.file.url,
          });
          continue;
        }

        const sub = await ensureFolder(app, key, rootFolder.id, folderCache);
        const saved = await uploadOne(app, file, sub.id);
        report.uploaded += 1;
        report.items.push({
          action: 'uploaded',
          rel: file.rel,
          sitePath: sitePathFor(file.rel),
          id: saved?.id,
          url: saved?.url,
          bytes: file.size,
        });
        process.stderr.write(`[sync-site-media] uploaded ${file.rel}\n`);
      } catch (err) {
        report.failed += 1;
        report.items.push({
          action: 'failed',
          rel: file.rel,
          error: err.message || String(err),
        });
        process.stderr.write(`[sync-site-media] FAILED ${file.rel}: ${err.message}\n`);
      }
    }

    const filesCount = await app.db.query('plugin::upload.file').count();
    report.libraryFileCount = filesCount;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await app.destroy();
  }

  if (report.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
