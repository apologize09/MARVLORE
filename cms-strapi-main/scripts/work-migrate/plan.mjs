import fs from 'node:fs';
import path from 'node:path';
import { extractStaticWork, REPO_ROOT } from './extract-static.mjs';

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath, rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

export function buildMigrationPlan(options = {}) {
  const extracted = extractStaticWork();
  const outDir = options.outDir || path.join(REPO_ROOT, 'docs/cms-phase4/artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const slugCounts = new Map();
  for (const p of extracted.projects) {
    slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
  }
  const duplicateSlugs = extracted.projects
    .filter((p) => slugCounts.get(p.slug) > 1)
    .map((p) => ({ legacyId: p.legacyId, slug: p.slug, title: p.title }));

  // Fix duplicate slugs in plan by appending legacyId suffix for duplicates
  const usedSlugs = new Set();
  for (const p of extracted.projects) {
    let slug = p.slug;
    if (usedSlugs.has(slug) || slugCounts.get(slug) > 1) {
      slug = `${p.slug}-${p.legacyId}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    }
    usedSlugs.add(slug);
    p.slug = slug;
  }

  const missingAssets = extracted.assets.filter((a) => !a.exists);
  const warnings = [];
  for (const p of extracted.projects) {
    if (!p.title) warnings.push({ legacyId: p.legacyId, code: 'EMPTY_TITLE' });
    if (!p.categorySlug) warnings.push({ legacyId: p.legacyId, code: 'NO_CATEGORY' });
    if (!p.coverUrl && !p.videoUrl) warnings.push({ legacyId: p.legacyId, code: 'NO_COVER' });
  }

  const plan = {
    generatedAt: new Date().toISOString(),
    mode: 'dry-run-default',
    locale: options.locale || 'zh-CN',
    rules: {
      defaultDryRun: true,
      executeRequiresFlag: '--execute',
      idempotencyKey: 'legacyId + locale',
      skipExistingByDefault: true,
      updateExistingRequiresFlag: '--update-existing',
      neverInvent: ['clientName', 'projectYear', 'outcomes', 'translations'],
      videoStrategy: 'static-path-refs (coverUrl/videoUrl string fields)',
    },
    counts: extracted.counts,
    duplicateSlugsBeforeFix: duplicateSlugs,
    warnings,
    missingAssets,
    categories: extracted.categories,
    tags: extracted.tags,
    projects: extracted.projects.map((p) => ({
      action: 'create',
      legacyId: p.legacyId,
      slug: p.slug,
      title: p.title,
      categorySlug: p.categorySlug,
      tagNames: p.tagNames,
      projectType: p.projectType,
      mediaCount: p.mediaItems.length,
      coverUrl: p.coverUrl,
      videoUrl: p.videoUrl,
    })),
  };

  const inventoryPath = path.join(outDir, 'work-migration-inventory.json');
  fs.writeFileSync(
    inventoryPath,
    JSON.stringify(
      {
        generatedAt: plan.generatedAt,
        websiteDist: extracted.websiteDist,
        counts: extracted.counts,
        categories: extracted.categories,
        tags: extracted.tags,
        projects: extracted.projects,
        assets: extracted.assets,
      },
      null,
      2
    ),
    'utf8'
  );

  writeCsv(
    path.join(outDir, 'work-migration-inventory.csv'),
    extracted.projects.map((p) => ({
      legacyId: p.legacyId,
      slug: p.slug,
      title: p.title,
      category: p.categorySlug,
      projectType: p.projectType,
      tags: (p.tagNames || []).join('|'),
      coverUrl: p.coverUrl || '',
      videoUrl: p.videoUrl || '',
      mediaCount: p.mediaItems.length,
      source: p.source,
    })),
    ['legacyId', 'slug', 'title', 'category', 'projectType', 'tags', 'coverUrl', 'videoUrl', 'mediaCount', 'source']
  );

  writeCsv(
    path.join(outDir, 'missing-assets.csv'),
    missingAssets.map((a) => ({
      url: a.url,
      kind: a.kind,
      owner: a.owner,
      abs: a.abs,
    })),
    ['url', 'kind', 'owner', 'abs']
  );

  writeCsv(
    path.join(outDir, 'duplicate-slugs.csv'),
    duplicateSlugs,
    ['legacyId', 'slug', 'title']
  );

  const planPath = path.join(outDir, 'work-migration-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

  return { plan, extracted, outDir, inventoryPath, planPath };
}
