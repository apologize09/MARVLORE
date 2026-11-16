import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildMigrationPlan } from './plan.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CMS_ROOT = path.resolve(__dirname, '../..');

const CAT = 'api::work-category.work-category';
const TAG = 'api::work-tag.work-tag';
const PROJECT = 'api::work-project.work-project';
const MEDIA = 'api::work-project-media.work-project-media';
const PAGE = 'api::work-page.work-page';

async function findByLegacyId(strapi, uid, legacyId, locale) {
  const rows = await strapi.documents(uid).findMany({
    locale,
    status: 'draft',
    filters: { legacyId: { $eq: legacyId } },
    limit: 1,
  });
  return rows[0] || null;
}

export async function executeMigration(options = {}) {
  if (!options.execute) {
    throw new Error('executeMigration requires { execute: true }');
  }

  const locale = options.locale || 'zh-CN';
  const updateExisting = !!options.updateExisting;
  const { plan, extracted, outDir } = buildMigrationPlan({ locale, outDir: options.outDir });

  process.chdir(CMS_ROOT);
  if (options.databaseFilename) {
    process.env.DATABASE_FILENAME = options.databaseFilename;
  }

  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  const report = {
    startedAt: new Date().toISOString(),
    locale,
    updateExisting,
    created: { categories: 0, tags: 0, projects: 0, media: 0 },
    skipped: { categories: 0, tags: 0, projects: 0, media: 0 },
    updated: { categories: 0, tags: 0, projects: 0, media: 0 },
    failed: [],
  };

  const categoryDocBySlug = new Map();
  const tagDocByName = new Map();

  try {
    // L1
    {
      const legacyId = extracted.categories.l1.legacyId;
      let doc = await findByLegacyId(app, CAT, legacyId, locale);
      if (doc && !updateExisting) {
        report.skipped.categories += 1;
      } else if (doc && updateExisting) {
        doc = await app.documents(CAT).update({
          documentId: doc.documentId,
          locale,
          status: 'published',
          data: {
            name: extracted.categories.l1.name,
            slug: extracted.categories.l1.slug,
            level: 1,
            isActive: true,
            sortOrder: 0,
            legacyId,
          },
        });
        report.updated.categories += 1;
      } else {
        doc = await app.documents(CAT).create({
          locale,
          status: 'published',
          data: {
            name: extracted.categories.l1.name,
            slug: extracted.categories.l1.slug,
            level: 1,
            isActive: true,
            sortOrder: 0,
            legacyId,
          },
        });
        report.created.categories += 1;
      }
      categoryDocBySlug.set('__l1__', doc);
    }

    // L2
    for (const cat of extracted.categories.l2) {
      try {
        let doc = await findByLegacyId(app, CAT, cat.legacyId, locale);
        const data = {
          name: cat.name,
          slug: cat.slug,
          level: 2,
          parent: categoryDocBySlug.get('__l1__').documentId,
          isActive: true,
          sortOrder: cat.sortOrder,
          description: cat.description || null,
          coverUrl: cat.coverUrl || null,
          legacyId: cat.legacyId,
        };
        if (doc && !updateExisting) {
          report.skipped.categories += 1;
        } else if (doc && updateExisting) {
          doc = await app.documents(CAT).update({
            documentId: doc.documentId,
            locale,
            status: 'published',
            data,
          });
          report.updated.categories += 1;
        } else {
          doc = await app.documents(CAT).create({ locale, status: 'published', data });
          report.created.categories += 1;
        }
        categoryDocBySlug.set(cat.slug, doc);
      } catch (err) {
        report.failed.push({ type: 'category', legacyId: cat.legacyId, error: err.message });
      }
    }

    // Tags
    for (const tag of extracted.tags) {
      try {
        let doc = await findByLegacyId(app, TAG, tag.legacyId, locale);
        const data = {
          name: tag.name,
          slug: tag.slug,
          isActive: true,
          legacyId: tag.legacyId,
        };
        if (doc && !updateExisting) {
          report.skipped.tags += 1;
        } else if (doc && updateExisting) {
          doc = await app.documents(TAG).update({
            documentId: doc.documentId,
            locale,
            status: 'published',
            data,
          });
          report.updated.tags += 1;
        } else {
          doc = await app.documents(TAG).create({ locale, status: 'published', data });
          report.created.tags += 1;
        }
        tagDocByName.set(tag.name, doc);
      } catch (err) {
        report.failed.push({ type: 'tag', legacyId: tag.legacyId, error: err.message });
      }
    }

    // Projects + media
    for (const project of extracted.projects) {
      try {
        const category = categoryDocBySlug.get(project.categorySlug);
        if (!category) {
          report.failed.push({
            type: 'project',
            legacyId: project.legacyId,
            error: `missing category ${project.categorySlug}`,
          });
          continue;
        }
        const tagIds = (project.tagNames || [])
          .map((n) => tagDocByName.get(n)?.documentId)
          .filter(Boolean);

        let doc = await findByLegacyId(app, PROJECT, project.legacyId, locale);
        const data = {
          title: project.title,
          slug: project.slug,
          subtitle: project.subtitle,
          eyebrow: project.eyebrow,
          summary: project.summary,
          description: project.description,
          category: category.documentId,
          tags: tagIds,
          projectType: project.projectType,
          focusX: project.focusX,
          isFeatured: !!project.isFeatured,
          showOnHome: !!project.showOnHome,
          sortOrder: project.sortOrder,
          coverUrl: project.coverUrl,
          thumbnailUrl: project.thumbnailUrl,
          videoUrl: project.videoUrl,
          posterUrl: project.posterUrl,
          previewVideoUrl: project.previewVideoUrl,
          homePreviewVideoUrl: project.homePreviewVideoUrl,
          legacyId: project.legacyId,
        };

        if (doc && !updateExisting) {
          report.skipped.projects += 1;
        } else if (doc && updateExisting) {
          doc = await app.documents(PROJECT).update({
            documentId: doc.documentId,
            locale,
            status: 'published',
            data,
          });
          report.updated.projects += 1;
        } else {
          doc = await app.documents(PROJECT).create({ locale, status: 'published', data });
          report.created.projects += 1;
        }

        for (const media of project.mediaItems || []) {
          try {
            let mdoc = await findByLegacyId(app, MEDIA, media.legacyId, locale);
            const mdata = {
              project: doc.documentId,
              blockType: media.blockType,
              imageUrl: media.imageUrl,
              videoUrl: media.videoUrl,
              posterUrl: media.posterUrl,
              altText: media.altText,
              sortOrder: media.sortOrder,
              legacyId: media.legacyId,
            };
            if (mdoc && !updateExisting) {
              report.skipped.media += 1;
            } else if (mdoc && updateExisting) {
              await app.documents(MEDIA).update({
                documentId: mdoc.documentId,
                locale,
                status: 'published',
                data: mdata,
              });
              report.updated.media += 1;
            } else {
              await app.documents(MEDIA).create({ locale, status: 'published', data: mdata });
              report.created.media += 1;
            }
          } catch (err) {
            report.failed.push({ type: 'media', legacyId: media.legacyId, error: err.message });
          }
        }
      } catch (err) {
        report.failed.push({ type: 'project', legacyId: project.legacyId, error: err.message });
      }
    }

    // Work page (single)
    try {
      const featured = extracted.projects
        .filter((p) => p.isFeatured)
        .slice(0, 8)
        .map((p) => findByLegacyId(app, PROJECT, p.legacyId, locale));
      const featuredDocs = (await Promise.all(featured)).filter(Boolean);
      const displayCats = extracted.categories.l2
        .map((c) => categoryDocBySlug.get(c.slug))
        .filter(Boolean);

      const existing = await app.documents(PAGE).findFirst({ locale, status: 'draft' });
      const pageData = {
        title: 'Work',
        intro: '精选作品与分类浏览',
        showFeatured: true,
        featuredProjects: featuredDocs.map((d) => d.documentId),
        displayCategories: displayCats.map((d) => d.documentId),
      };
      if (existing?.documentId) {
        if (updateExisting) {
          await app.documents(PAGE).update({
            documentId: existing.documentId,
            locale,
            status: 'published',
            data: pageData,
          });
        }
      } else {
        await app.documents(PAGE).create({ locale, status: 'published', data: pageData });
      }
    } catch (err) {
      report.failed.push({ type: 'work-page', legacyId: 'work-page', error: err.message });
    }

    report.finishedAt = new Date().toISOString();
    report.planCounts = plan.counts;

    const reportPath = path.join(outDir, 'work-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    return { report, reportPath, outDir };
  } finally {
    await app.destroy();
  }
}
