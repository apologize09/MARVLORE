#!/usr/bin/env node
/**
 * Remove Phoenix Pouch legacy CMS content & uploads.
 * Keeps Marvlore work-* / V1.0 site types and admin users.
 * Dry-run by default. Use --execute to write.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const LEGACY_UIDS = [
  // api::about.about / api::global.global removed from src/api (use about-page / global-setting)
  'api::article.article',
  'api::author.author',
  'api::category.category',
  'api::certification.certification',
  'api::faq.faq',
  'api::page-seo.page-seo',
];

const KEEP_FILE_NAME_HINTS = []; // Marvlore media is mostly static on the website

function parseArgs(argv) {
  const opts = { execute: false, database: null, purgeUploads: true };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--execute') opts.execute = true;
    else if (a === '--database' && argv[i + 1]) opts.database = argv[++i];
    else if (a === '--keep-uploads') opts.purgeUploads = false;
  }
  return opts;
}

function isPhoenixFile(file) {
  const blob = `${file.name || ''} ${file.url || ''} ${file.hash || ''} ${file.alternativeText || ''} ${file.caption || ''}`.toLowerCase();
  return (
    blob.includes('phoenix') ||
    blob.includes('nicotine') ||
    blob.includes('nootropic') ||
    blob.includes('caffeine') ||
    blob.includes('pouch') ||
    blob.includes('cgmp') ||
    blob.includes('hplc') ||
    blob.includes('cleanroom') ||
    blob.includes('broadway')
  );
}

async function deleteAllDocuments(strapi, uid) {
  const deleted = [];
  for (const status of ['published', 'draft']) {
    let rows = [];
    try {
      rows = await strapi.documents(uid).findMany({ status, limit: 200 });
    } catch {
      rows = [];
    }
    for (const row of rows || []) {
      if (!row?.documentId) continue;
      await strapi.documents(uid).delete({ documentId: row.documentId });
      deleted.push({ documentId: row.documentId, status });
    }
  }
  // single types may need findFirst
  try {
    const one = await strapi.documents(uid).findFirst({});
    if (one?.documentId) {
      await strapi.documents(uid).delete({ documentId: one.documentId });
      deleted.push({ documentId: one.documentId, status: 'single' });
    }
  } catch {
    // not a single type or already empty
  }
  return deleted;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.database) process.env.DATABASE_FILENAME = opts.database;

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: path.join(root, 'dist') }).load();
  const report = {
    execute: opts.execute,
    legacy: {},
    files: { candidates: 0, deleted: 0, kept: 0, names: [] },
  };

  try {
    for (const uid of LEGACY_UIDS) {
      let count = 0;
      try {
        const pub = await app.documents(uid).findMany({ status: 'published', limit: 200 });
        const draft = await app.documents(uid).findMany({ status: 'draft', limit: 200 });
        count = (pub?.length || 0) + (draft?.length || 0);
        try {
          const one = await app.documents(uid).findFirst({});
          if (one) count = Math.max(count, 1);
        } catch {
          // ignore
        }
      } catch (err) {
        report.legacy[uid] = { error: String(err.message || err) };
        continue;
      }

      if (!opts.execute) {
        report.legacy[uid] = { action: 'would-delete', approxRows: count };
        continue;
      }
      const deleted = await deleteAllDocuments(app, uid);
      report.legacy[uid] = { action: 'deleted', count: deleted.length };
    }

    const files = await app.db.query('plugin::upload.file').findMany({ limit: 500 });
    const victims = (files || []).filter(isPhoenixFile);
    report.files.candidates = victims.length;
    report.files.names = victims.map((f) => f.name).slice(0, 40);

    if (opts.execute && opts.purgeUploads) {
      for (const file of victims) {
        try {
          await app.plugin('upload').service('upload').remove(file);
          report.files.deleted += 1;
        } catch (err) {
          report.files.kept += 1;
          report.files.names.push(`FAIL:${file.name}:${err.message}`);
        }
      }
      // Sweep leftover phoenix* files on disk (formats / orphans)
      const uploadsDir = path.join(root, 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        for (const name of fs.readdirSync(uploadsDir)) {
          const lower = name.toLowerCase();
          if (
            lower.includes('phoenix') ||
            lower.includes('nicotine') ||
            lower.includes('nootropic') ||
            lower.includes('caffeine_') ||
            lower.includes('pouch')
          ) {
            try {
              fs.unlinkSync(path.join(uploadsDir, name));
              report.files.deleted += 1;
            } catch {
              // ignore
            }
          }
        }
      }
    }

    // Drop Public role permissions for legacy Phoenix controllers
    const legacyControllers = [
      'about',
      'article',
      'author',
      'category',
      'certification',
      'faq',
      'global',
      'page-seo',
    ];
    report.permissions = { revoked: 0 };
    if (opts.execute) {
      const publicRole = await app.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });
      if (publicRole) {
        for (const controller of legacyControllers) {
          for (const action of ['find', 'findOne', 'create', 'update', 'delete']) {
            const actionId = `api::${controller}.${controller}.${action}`;
            const existing = await app.query('plugin::users-permissions.permission').findOne({
              where: { action: actionId, role: publicRole.id },
            });
            if (existing?.id) {
              await app.query('plugin::users-permissions.permission').delete({ where: { id: existing.id } });
              report.permissions.revoked += 1;
            }
          }
        }
      }
    } else {
      report.permissions.action = 'would-revoke-legacy-public';
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
