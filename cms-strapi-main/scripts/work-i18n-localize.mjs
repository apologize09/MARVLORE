#!/usr/bin/env node
/**
 * Create/update English (en) localizations for Work documents from zh-CN.
 *
 * Rules (no invented marketing copy):
 * - Keep fields that are already mostly Latin/English.
 * - Leave Chinese-only text empty for editorial translation.
 * - SEO metaTitle falls back to English title when available.
 * - Default dry-run; pass --execute to write.
 *
 * Usage:
 *   node scripts/work-i18n-localize.mjs
 *   node scripts/work-i18n-localize.mjs --execute --database=.tmp/data.db
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createStrapi } = require('@strapi/strapi');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

function parseArgs(argv) {
  const opts = { execute: false, database: null, localeFrom: 'zh-CN', localeTo: 'en' };
  for (const arg of argv) {
    if (arg === '--execute') opts.execute = true;
    else if (arg.startsWith('--database=')) opts.database = arg.slice('--database='.length);
  }
  return opts;
}

function mostlyLatin(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  const latin = (s.match(/[A-Za-z0-9]/g) || []).length;
  const cjk = (s.match(/[\u3400-\u9FFF]/g) || []).length;
  return latin > 0 && latin >= cjk;
}

function pickLocalizedText(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return mostlyLatin(s) ? s : null;
}

const UIDS = {
  category: 'api::work-category.work-category',
  tag: 'api::work-tag.work-tag',
  project: 'api::work-project.work-project',
  page: 'api::work-page.work-page',
};

async function listPublished(strapi, uid, locale, populate) {
  return strapi.documents(uid).findMany({
    locale,
    status: 'published',
    limit: 200,
    ...(populate ? { populate } : {}),
  });
}

async function upsertLocale(strapi, uid, documentId, locale, data, { execute }) {
  if (!execute) return { action: 'dry-run', documentId, locale };
  await strapi.documents(uid).update({
    documentId,
    locale,
    status: 'published',
    data,
  });
  return { action: 'upserted', documentId, locale };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.database) {
    process.env.DATABASE_FILENAME = opts.database;
  }

  const app = await createStrapi({ distDir: './dist', appDir: root }).load();
  const report = {
    mode: opts.execute ? 'execute' : 'dry-run',
    from: opts.localeFrom,
    to: opts.localeTo,
    categories: [],
    tags: [],
    projects: [],
    pages: [],
  };

  try {
    const categories = await listPublished(app, UIDS.category, opts.localeFrom);
    for (const cat of categories) {
      const data = {
        name: pickLocalizedText(cat.name) || cat.slug,
        slug: cat.slug,
        description: pickLocalizedText(cat.description),
        level: cat.level,
        coverUrl: cat.coverUrl ?? null,
        sortOrder: cat.sortOrder ?? 0,
        isActive: cat.isActive !== false,
        legacyId: cat.legacyId ?? null,
      };
      report.categories.push(await upsertLocale(app, UIDS.category, cat.documentId, opts.localeTo, data, opts));
    }

    const tags = await listPublished(app, UIDS.tag, opts.localeFrom);
    for (const tag of tags) {
      const data = {
        name: pickLocalizedText(tag.name) || tag.slug,
        slug: tag.slug,
        description: pickLocalizedText(tag.description),
        color: tag.color ?? null,
        sortOrder: tag.sortOrder ?? 0,
        isActive: tag.isActive !== false,
        legacyId: tag.legacyId ?? null,
      };
      report.tags.push(await upsertLocale(app, UIDS.tag, tag.documentId, opts.localeTo, data, opts));
    }

    const projects = await listPublished(app, UIDS.project, opts.localeFrom, {
      category: { fields: ['documentId'] },
      tags: { fields: ['documentId'] },
    });
    for (const project of projects) {
      const title = pickLocalizedText(project.title) || project.slug;
      const data = {
        title,
        slug: project.slug,
        subtitle: pickLocalizedText(project.subtitle),
        eyebrow: pickLocalizedText(project.eyebrow),
        summary: pickLocalizedText(project.summary),
        description: pickLocalizedText(project.description),
        coverUrl: project.coverUrl ?? null,
        thumbnailUrl: project.thumbnailUrl ?? null,
        heroMediaUrl: project.heroMediaUrl ?? null,
        videoUrl: project.videoUrl ?? null,
        posterUrl: project.posterUrl ?? null,
        previewVideoUrl: project.previewVideoUrl ?? null,
        homePreviewVideoUrl: project.homePreviewVideoUrl ?? null,
        clientName: pickLocalizedText(project.clientName),
        projectYear: project.projectYear ?? null,
        projectType: project.projectType,
        focusX: project.focusX ?? null,
        focusY: project.focusY ?? null,
        isFeatured: !!project.isFeatured,
        showOnHome: !!project.showOnHome,
        sortOrder: project.sortOrder ?? 0,
        legacyId: project.legacyId ?? null,
        // Keep relations so public filters (active category) still match in `en`.
        category: project.category?.documentId || null,
        tags: Array.isArray(project.tags) ? project.tags.map((t) => t.documentId).filter(Boolean) : [],
        seo: {
          metaTitle: title,
          metaDescription: pickLocalizedText(project.summary) || pickLocalizedText(project.subtitle) || title,
        },
      };
      report.projects.push(
        await upsertLocale(app, UIDS.project, project.documentId, opts.localeTo, data, opts),
      );
    }

    const pages = await listPublished(app, UIDS.page, opts.localeFrom, {
      featuredProjects: { fields: ['documentId'] },
      displayCategories: { fields: ['documentId'] },
    });
    for (const page of pages) {
      const title = pickLocalizedText(page.title) || 'Creative Work';
      const data = {
        title,
        intro: pickLocalizedText(page.intro),
        showFeatured: page.showFeatured !== false,
        featuredProjects: Array.isArray(page.featuredProjects)
          ? page.featuredProjects.map((p) => p.documentId).filter(Boolean)
          : [],
        displayCategories: Array.isArray(page.displayCategories)
          ? page.displayCategories.map((c) => c.documentId).filter(Boolean)
          : [],
        seo: {
          metaTitle: title,
          metaDescription:
            pickLocalizedText(page.intro) ||
            'MARVLORE creative work — film, visual design, web and culture.',
        },
      };
      report.pages.push(await upsertLocale(app, UIDS.page, page.documentId, opts.localeTo, data, opts));
    }

    console.log(
      JSON.stringify(
        {
          ...report,
          counts: {
            categories: report.categories.length,
            tags: report.tags.length,
            projects: report.projects.length,
            pages: report.pages.length,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
